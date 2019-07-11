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
var produceSet = null       // an array of all the produce that the country interacts with across the years
var svg = null

// ****************************************************************************************
// CONSTANTS 
// ****************************************************************************************
// bar graph visualization dimensions
const margin = { top: 10, right: 20, bottom: 30, left: 115 }

// bar graph configurations
const dangerZoneThreshold = 20
const bar = {
  height: 6,
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
  d3.csv('./data/percent_consumption.csv').then(function (data) {
    // cache the read csv for future redraws
    readCSV = data

    // add an event listener to the country select so we can change views
    var countrySelect = document.getElementById('country-select')
    countrySelect.addEventListener('change', changeCountryView)

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

// called when the window is resized
$(window).resize((function (){
  console.log('Redrawing year slider!')
  drawYearSlider()

  console.log('Redrawing bar chart!')
  drawBarChart()
}))

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

  var yearTicksXValues = []
  console.log(d3.select('#slider-axis').selectAll('.tick'))
  d3.select('#slider-axis')
    .selectAll('.tick')
    .nodes()
    .forEach(function(tick, index){
      console.log(tick)
      yearTicksXValues.push((tick.getAttribute('transform').slice(10).split(','))[0])
    })
  console.log(yearTicksXValues) 

  // draw the slider toggler, a circle
  sliderSVG
    .append('circle')
    .attr('r', slider.toggler.radius)
    .attr('cx', function () {
      // the toggler's initial position is at the currently selected year
      return yearScale(yearIndex)
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
        console.log('mousemove')
        console.log(this)
        // get the x coordinate of the mouse relative to the svg
        var mouseX = (d3.mouse(this))[0]

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
    // update currently selected year if it is clicked on on the axis
    .on('mousedown', function(){
      // calculate the spacing between the year axis ticks
      var tickSpacing = parseFloat(yearTicksXValues[1]) - parseFloat(yearTicksXValues[0]) 

      // x coordinate of mouse relative to the first tick
      var mouseX = (d3.mouse(this))[0]
      var leftmostTickX = parseFloat(yearTicksXValues[0])
      var roundedX = mouseX - leftmostTickX
      
      // update the index of the currently selected year in the available years array
      yearIndex = Math.floor(roundedX / tickSpacing)

      // finish rounding mouseX to nearest yearScale tick
      roundedX = Math.floor(roundedX / tickSpacing) * tickSpacing
      roundedX += leftmostTickX

      // update the position of the toggler
      var sliderToggler = d3.select('#slider-toggler')
      sliderToggler.attr('cx', roundedX)

      updateBars()
    })
}

// update the widths of the bars to correspond to the percent consumption for the newly selected year
function updateBars() {
  var updatedData = readCSV.filter(entry => ((entry['Country'] == selectedCountry)
    && (entry['Year'] == availableYears[yearIndex])))

  // create a lookup table (key = produce name, value = percent consumed) for the updated data
  var percentConsumptionLookup = {}
  updatedData.forEach(entry => (percentConsumptionLookup[entry['Produce']] = entry['Percent Consumed']))

  d3
    .selectAll('.bar')
    .attr('width', function () {
      // use the bar's id (its produce name), 
      // to lookup the new percent consumption of this produce for the new year
      var percentConsumption = percentConsumptionLookup[this.id]

      if (percentConsumption == undefined) {
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
    .on('click', function () {
      if (watching.has(this.id)) {
        watching.delete(this.id)
        if (percentConsumptionLookup[this.id] < dangerZoneThreshold) {
          this.setAttribute('fill', bar.color.dangerZone)
        }
        else {
          this.setAttribute('fill', bar.color.normal)
        }
      }
      else {
        watching.add(this.id)
        if (percentConsumptionLookup[this.id] < dangerZoneThreshold) {
          this.setAttribute('fill', bar.color.watchInDangerZone)
        }
        else {
          this.setAttribute('fill', bar.color.watching)
        }
      }
    })

  updateLabels(updatedData)
  console.log('Updated bars for ' + availableYears[yearIndex] + '!')
}

function updateLabels(data) {
  // remove any old labels
  d3
    .selectAll('.label')
    .remove()

  // record the produce included in the data for the current year
  var availableProduce = data.map(entry => entry['Produce'])

  // create labels for data that is not available for this year
  var labels = []
  produceSet.forEach(function (produce) {
    if (!availableProduce.includes(produce)) {
      labels.push({
        produce: produce,
        text: label.noDataAvailable
      })
    }
  })

  // create labels for produce that have 0 percent consumption for this year
  data.forEach(function (entry) {
    if (entry['Percent Consumed'] == 0) {
      labels.push({
        produce: entry['Produce'],
        text: label.zeroConsumption
      })
    }
  })

  // draw labels
  svg
    .selectAll('labels')
    .data(labels)
    .enter()
    .append('text')
    .text(function (d, i) {
      return d['text']
    })
    .attr('x', margin.left + 5)
    .attr('y', function (d, i) {
      return produceScale(d['produce']) + 4
    })
    .attr('fill', function (d, i) {
      if (d['text'] == label.zeroConsumption) {
        return 'red'
      }
      return 'grey'
    })
    .attr('class', 'label')
}

// draw the bar graph for the newly selected country
function drawBarChart() {
  // remove any previously drawn bar chart
  var barChart = document.getElementById('bar-chart')
  while(barChart.firstChild){
    barChart.removeChild(barChart.firstChild)
  }

  // select the data relevant to this country and record all the produce included in this data
  var data = readCSV.filter(entry => (entry['Country'] == selectedCountry))
  produceSet = Array.from(new Set(data.map(entry => entry['Produce'])))

  // then filter the data by the earliest available year by default
  data = data.filter(entry => (entry['Year'] == availableYears[0]))

  // create a lookup table (key = produce name, value = percent consumed) for the updated data
  var percentConsumptionLookup = {}
  data.forEach(entry => (percentConsumptionLookup[entry['Produce']] = entry['Percent Consumed']))

  // remove any previously visualized data
  var viz = document.getElementById('bar-chart')
  while (viz.firstChild) {
    viz.removeChild(viz.firstChild)
  }

  var width = $('#bar-chart').parent().width() - margin.left - margin.right - 20
  var height = produceSet.length * bar.height * 2
  // create an svg for the bar graph
  svg = d3.select('#bar-chart')
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
  svg
    .selectAll('bars')
    .data(produceSet)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('id', function (produce) {
      // set the bar's id to its produce name so we can do quick lookups on updates
      return produce
    })
    .attr('x', margin.left)
    .attr('y', function (produce) {
      return produceScale(produce) - (bar.height / 2)
    })
    .attr('width', function (produce) {
      var percentConsumption = percentConsumptionLookup[produce]
      if (percentConsumption == undefined) {
        return 0
      }
      return percentScale(percentConsumption) - margin.left
    })
    .attr('height', bar.height)
    .attr('fill', function (produce) {
      if (percentConsumptionLookup[produce] < dangerZoneThreshold) {
        return bar.color.dangerZone
      }
      return bar.color.normal
    })
    .on('click', function (produce) {
      if (watching.has(produce)) {
        watching.delete(produce)
        if (percentConsumptionLookup[produce] < dangerZoneThreshold) {
          this.setAttribute('fill', bar.color.dangerZone)
        }
        else {
          this.setAttribute('fill', bar.color.normal)
        }
      }
      else {
        watching.add(produce)
        if (percentConsumptionLookup[produce] < dangerZoneThreshold) {
          this.setAttribute('fill', bar.color.watchInDangerZone)
        }
        else {
          this.setAttribute('fill', bar.color.watching)
        }
      }
    })

  updateLabels(data)
}
