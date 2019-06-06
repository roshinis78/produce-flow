// ****************************************************************************************
// GLOBAL VARIABLES 
// the following global variables are global so that they can be used across chart updates
// ****************************************************************************************
var selectedCountry = null  // the currently selected country
var availableYears = null   // an array of the available years of data for the selected country
var yearIndex = 0           // the index of the currently selected year in the above array
var readCSV = null          // the cached object read from the csv on the initial page load
var sliding = false         // whether the year slider is sliding or not
var percentScale = null     // save the scale used for the percent axis
var produceScale = null     // save the scale used for the produce axis
var watching = new Set()    // a set of all the produce that are currently being watched by the user

// ****************************************************************************************
// CONSTANTS 
// ****************************************************************************************
// bar graph visualization dimensions
const margin = { top: 10, right: 20, bottom: 30, left: 115 }
const width = 1000
const height = 400

// bar graph configurations
const dangerZoneThreshold = 20
const bar = {
  height: 7,
  color: {
    normal: '#ffd633',
    dangerZone: '#ff3300',
    watching: 'teal',
    watchInDangerZone: 'purple'
  }
}

// slider configurations
const slider = {
  margin: {
    right: 20,
    left: 20
  },
  width: null,
  tickSize: 15,
  toggler: {
    lag: 10, // distance threshold only after which we shall move the toggler
    radius: 6,
    border: {
      width: 2,
      color: '#00B0FF'
    },
    fill: 'skyblue'
  }
}

// label constants
var label = {
  zeroConsumption: '!!! 0% CONSUMPTION !!!',
  noDataAvailable: 'no data available for this year'
}

// called only once when dom is ready
$(function () {
  d3.csv('../data/percent_consumption.csv').then(function (data) {
    // cache the read csv for future redraws
    readCSV = data

    // add an event listener to the view button so we can change views
    var viewButton = document.getElementById('view-button')
    viewButton.addEventListener('click', changeCountryView)

    // populate the country selector with an alphabetical list of countries/regions as options
    var countries = (Array.from(new Set(data.map(entry => entry['Country'])))).sort()
    var countrySelect = document.getElementById('country-select')
    countries.forEach(function (country, index) {
      var option = document.createElement('option')
      option.setAttribute('value', country)
      option.innerHTML = country;
      // the first country in the list should be selected by default
      if (index == 0) {
        country.selected = true
        selectedCountry = country
      }
      countrySelect.appendChild(option)
    })

    // initialize the global array to contain the years that the default country has data for
    updateAvailableYears()

    // draw the year slider and the bar chart
    drawYearSlider()
    drawBarChart()
  })
})

// ****************************************************************************************
// UPDATE FUNCTIONS: to update the chart, slider, and global variables
// ****************************************************************************************
// this function updates the global array 'availableYears'
function updateAvailableYears() {
  var allEntriesForCountry = readCSV.filter(entry => (entry['Country'] == selectedCountry))
  var allYears = allEntriesForCountry.map(entry => parseInt(entry['Year']))
  availableYears = (Array.from(new Set(allYears))).sort()
}

// event handler for 'View' button, update the currently selected country if it has changed
function changeCountryView() {
  var countrySelectValue = document.getElementById('country-select').value
  if (countrySelectValue != selectedCountry) {
    selectedCountry = countrySelectValue
    console.log('Switched view to ' + selectedCountry + '!')

    // update the global array to contain the years that this country has data for
    updateAvailableYears()

    // clear the record of produce being watched
    watching.clear()

    // redraw the year slider and the bar chart
    drawYearSlider()
    drawBarChart()
  }
}

// draw the year slider onto the page
function drawYearSlider() {
  // remove the previously drawn slider
  sliderSVGElement = document.getElementById('slider-svg')
  while (sliderSVGElement.firstChild) {
    sliderSVGElement.removeChild(sliderSVGElement.firstChild)
  }

  // set svg width to width of containing div
  slider.width = document.getElementById('year-slider').clientWidth - slider.margin.left - slider.margin.right

  // create an axis with a scale of the available years
  var sliderSVG = d3.select('#slider-svg')
  yearScale = d3
    .scaleOrdinal()
    .domain(availableYears)
    .range(d3.range(slider.margin.left, slider.width + 1, (slider.width + 1) / availableYears.length))

  sliderAxis = d3
    .axisBottom(yearScale)
    .tickSize(slider.tickSize)

  sliderSVG
    .append('g')
    .call(sliderAxis)
    .attr('id', 'slider-axis')
    .style('transform', 'translate(0%, 40%)')

  // draw the slider toggler, a circle
  sliderSVG
    .append('circle')
    .attr('r', slider.toggler.radius)
    .attr('cx', function () {
      // the toggler starts at the first available year by default
      return yearScale(availableYears[0])
    })
    .attr('cy', 20.5)
    .style('fill', slider.toggler.fill)
    .style('stroke', slider.toggler.border.color)
    .style('stroke-width', slider.toggler.border.width)
    .on('mousedown', function () {
      sliding = true
    })
    .attr('id', 'slider-toggler')

  sliderSVG
    .on('mousemove', function () {
      if (sliding) {
        // get the x coordinate of the mouse relative to the svg
        mouseX = (d3.mouse(this))[0]

        var sliderToggler = d3.select('#slider-toggler')
        var sliderTogglerX = parseFloat(sliderToggler.attr('cx'))

        // increment the currently selected year if the mouse is pulling the toggler to the right
        if ((mouseX > sliderTogglerX + slider.toggler.radius + slider.toggler.lag)
          && (yearIndex + 1 < availableYears.length)) {
          sliderToggler.attr('cx', yearScale(availableYears[++yearIndex]))
          updateBars()
        }

        // decrement the currently selected year if the mouse is pulling the toggler to the left
        else if ((mouseX < sliderTogglerX - slider.toggler.radius - slider.toggler.lag)
          && (yearIndex - 1 >= 0)) {
          sliderToggler.attr('cx', yearScale(availableYears[--yearIndex]))
          updateBars()
        }
      }
    })
    .on('mouseup', function () {
      sliding = false
    })
}

// update the widths of the bars to correspond to the percent consumption for the newly selected year
function updateBars() {
  // create a lookup table (key = produce name, value = percent consumed) for the updated data
  var updatedData = readCSV.filter(entry => ((entry['Country'] == selectedCountry)
    && (entry['Year'] == availableYears[yearIndex])))
  var percentConsumptionLookup = {}
  updatedData.forEach(entry => (percentConsumptionLookup[entry['Produce']] = entry['Percent Consumed']))
  console.log(percentConsumptionLookup['42'])

  var noDataAvailable = []
  d3
    .selectAll('.bar')
    .attr('width', function () {
      // use the bar's id (its produce name), 
      // to lookup the new percent consumption of this produce for the new year
      var percentConsumption = percentConsumptionLookup[this.id]

      // if the produce name does not exist in the lookup table, we do not have data for this year
      // for this produce, so mark this produce as 'no data available'
      if (percentConsumption == undefined) {
        noDataAvailable.push(this.id)
        return 0
      }
      return percentScale(percentConsumptionLookup[this.id]) - margin.left
    })
    .attr('fill', function () {
      var isBeingWatched = watching.has(this.id)
      if (percentConsumptionLookup[this.id] < dangerZoneThreshold) {
        if (isBeingWatched) {
          return bar.color.watchInDangerZone
        }
        return bar.color.dangerZone
      }
      else if (isBeingWatched) {
        return bar.color.watching
      }
      return bar.color.normal
    })

  console.log('Updated bars for ' + availableYears[yearIndex] + '!')
}

// draw the bar graph for the newly selected country
function drawBarChart() {
  // select the data relevant to this country and record all the produce included in this data
  var data = readCSV.filter(entry => (entry['Country'] == selectedCountry))
  var produceSet = Array.from(new Set(data.map(entry => entry['Produce'])))

  // then filter the data by the earliest available year by default
  data = data.filter(entry => (entry['Year'] == availableYears[0]))

  // remove any previously visualized data
  var viz = document.getElementById('bar-chart')
  while (viz.firstChild) {
    viz.removeChild(viz.firstChild)
  }

  // create an svg for the bar graph
  var svg = d3.select('#bar-chart')
    .append('svg')
    .attr('width', width + margin.right + margin.left)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

  // scales - saved globally 
  percentScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([margin.left, width])

  produceScale = d3
    .scaleOrdinal()
    .domain(produceSet)
    .range(d3.range(margin.top, height + 1, (height + 1 - margin.top) / produceSet.length))

  // axes
  svg
    .append('g')
    .call(d3.axisLeft(produceScale))
    .attr('transform', 'translate(' + margin.left + ',0)')
  svg
    .append('g')
    .call(d3.axisBottom(percentScale))
    .attr('transform', 'translate(0,' + height + ')')

  // bars
  var labels = []
  svg
    .selectAll('bars')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('id', function (d, i) {
      // set the bar's id to its produce name so we can do quick lookups on updates
      return d['Produce']
    })
    .attr('x', margin.left)
    .attr('y', function (d, i) {
      return produceScale(d['Produce']) - (bar.height / 2)
    })
    .attr('width', function (d, i) {
      // add label if necessary
      if (d['Percent Consumed'] == 0) {
        labels.push({
          produce: d['Produce'],
          text: label.zeroConsumption
        })
      }
      if (d['Percent Consumed'] == undefined) {
        labels.push({
          produce: d['Produce'],
          text: label.noDataAvailable
        })
      }

      // return width
      return percentScale(d['Percent Consumed']) - margin.left
    })
    .attr('height', bar.height)
    .attr('fill', function (d, i) {
      if (d['Percent Consumed'] < dangerZoneThreshold) {
        return bar.color.dangerZone
      }
      return bar.color.normal
    })
    .on('click', function (d, i) {
      if (watching.has(d['Produce'])) {
        watching.delete(d['Produce'])
        if (d['Percent Consumed'] < dangerZoneThreshold) {
          this.setAttribute('fill', bar.color.dangerZone)
        }
        else {
          this.setAttribute('fill', bar.color.normal)
        }
      }
      else {
        watching.add(d['Produce'])
        if (d['Percent Consumed'] < dangerZoneThreshold) {
          this.setAttribute('fill', bar.color.watchInDangerZone)
        }
        else {
          this.setAttribute('fill', bar.color.watching)
        }
      }
    })

  svg
    .selectAll('labels')
    .data(labels)
    .enter()
    .append('text')
    .text(function (d, i) {
      return d['text']
    })
    .attr('x', margin.left + 2)
    .attr('y', function (d, i) {
      return produceScale(d['Produce'] - 10)
    })
    .attr('fill', function (d, i) {
      if (d['text'] == label.zeroConsumption) {
        return 'red'
      }
      return 'grey'
    })
}
