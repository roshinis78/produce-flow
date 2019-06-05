var country = null
var year = null
var readCSV = null // cache the csv once read

var sliding = false // whether the slider is sliding or not

// this function is called whenever the view button is pressed
function changeCountryView() {
  var selectedCountry = document.getElementById('country-select').value
  console.log('Switching view to ' + selectedCountry + '!')
  country = selectedCountry
  var years = Array.from(new Set((readCSV.filter(entry => (entry['Country'] == country))).map(row => row['Year'])))
  year = years[0]

  // redraw the slider and the bar chart
  drawYearSlider(years);
  drawViz();
}

// called only once when dom is ready
$(function () {
  d3.csv('../data/percent_consumption.csv').then(function (data) {
    // cache the read csv for future redraws
    readCSV = data

    // add an event listener to the view button so we can change views
    var viewButton = document.getElementById('view-button')
    viewButton.addEventListener('click', changeCountryView)

    // populate the country selector options with the countries
    var countries = Array.from(new Set(data.map(entry => entry['Country'])))
    var countrySelect = document.getElementById('country-select')
    countries.forEach(function (country, index) {
      var option = document.createElement('option')
      option.setAttribute('value', country)
      option.innerHTML = country;
      if (index == 0) {
        country.selected = true
      }
      countrySelect.appendChild(option)
    })

    // set the default values for the selected country and year
    country = countries[0]
    var years = Array.from(new Set((data.filter(entry => (entry['Country'] == country))).map(row => row['Year'])))
    year = years[0]

    console.log('Set default country to ' + country)
    console.log('Set intial year to ' + year)

    drawYearSlider(years)

    // draw the visualization!
    drawViz()
  })
})

function drawYearSlider(years) {
  // add the year slider
  var slider = {
    margin: {
      right: 20,
      left: 20
    },
    width: null,
    tickSize: 15
  }

  // set svg width to width of containing div
  slider.width = document.getElementById('year-slider').clientWidth - slider.margin.left - slider.margin.right

  var sliderSVG = d3.select('#slider-svg')

  sliderSVG
    .on('mousemove', function (event) {
      if (sliding == true) {
        console.log('Sliding!')
        var mouseX = (d3.mouse(this))[0]
        if (mouseX > slider.margin.left && mouseX <= slider.width - 10)
          d3.select('#slider-control').attr('cx', mouseX)
      }
    })

  // axes
  yearScale = d3
    .scaleOrdinal()
    .domain(years)
    .range(d3.range(slider.margin.left, slider.width + 1, (slider.width + 1) / years.length))

  sliderAxis = d3
    .axisBottom(yearScale)
    .tickSize(slider.tickSize)

  sliderSVG
    .append('g')
    .call(sliderAxis)
    .attr('id', 'slider-axis')
    .style('transform', 'translate(0%, 40%)')

  // slider toggle 
  sliderAxisElement = document.getElementById('slider-axis')
  console.log(sliderAxisElement)
  sliderSVG
    .append('circle')
    .attr('r', 9)
    .attr('cx', function (year) {
      return yearScale(year)
    })
    .attr('cy', 20.5)
    .style('fill', 'skyblue')
    .on('mousedown', function () {
      console.log('Starting to slide...')
      sliding = true
    })
    .on('mouseup', function () {
      console.log('Not sliding anymore.')
      sliding = false
    })
    .attr('id', 'slider-control')
}


function drawViz() {
  // only select data relevant to the country and year in question
  var data = readCSV.filter(entry => ((entry['Country'] == country) && (entry['Year'] == year)))
  console.log('Printing data for ' + country + ' from ' + year)
  console.log(data)

  // remove any previously visualized data
  var viz = document.getElementById('bar-chart')
  while (viz.firstChild) {
    viz.removeChild(viz.firstChild)
  }

  // visualize the data as a stacked bar graph!
  stackedBarVisualize(data)
}

function stackedBarVisualize(data) {
  const margin = { top: 10, right: 20, bottom: 30, left: 115 }
  const width = 1000
  const height = 600

  var svg = d3.select('#bar-chart')
    .append('svg')
    .attr('width', width + margin.right + margin.left)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

  // axes
  var percentScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([margin.left, width])
  var percentAxis = d3.axisBottom(percentScale)

  var produceSet = Array.from(new Set(data.map(entry => (entry['Produce'].split(','))[0])))
  var produceScale = d3
    .scaleOrdinal()
    .domain(produceSet)
    .range(d3.range(margin.top, height + 1, (height + 1 - margin.top) / produceSet.length))
  var produceAxis = d3.axisLeft(produceScale)

  svg
    .append('g')
    .call(produceAxis)
    .attr('transform', 'translate(' + margin.left + ',0)')

  svg
    .append('g')
    .call(percentAxis)
    .attr('transform', 'translate(0,' + height + ')')

  // bars in bar graph
  var bar = {
    height: 7,
    color: {
      normal: '#ffd633',
      dangerZone: '#ff3300'
    }
  }

  const dangerZoneThreshold = 20
  svg
    .selectAll('bars')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', margin.left)
    .attr('y', function (d, i) {
      var firstFewWords = ((d['Produce']).split(','))[0]
      return produceScale(firstFewWords) - (bar.height / 2)
    })
    .attr('width', function (d, i) {
      return percentScale(d['Percent Consumed']) - margin.left
    })
    .attr('height', bar.height)
    .attr('fill', function (d, i) {
      if (d['Percent Consumed'] < dangerZoneThreshold) {
        return bar.color.dangerZone
      }
      return bar.color.normal
    })
}