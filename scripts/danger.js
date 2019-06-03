var country = 'Costa Rica'
var year = '2006'

// For bar graphs
$(function () {
  d3.csv('../data/percent_consumption.csv').then(function (data) {
    // populate the country selector options with the countries
    countries = Array.from(new Set(data.map(entry => entry['Country'])))
    countrySelect = document.getElementById('country-select')
    countries.forEach(function (country) {
      var option = document.createElement('option')
      option.setAttribute('value', country)
      option.innerHTML = country;
      countrySelect.appendChild(option)
    })

    // only select data relevant to the country and year in question
    data = data.filter(entry => ((entry['Country'] == country) && (entry['Year'] == year)))
    console.log('Printing data for ' + country + ' from ' + year)
    console.log(data)

    // visualize the data as a stacked bar graph!
    stackedBarVisualize(data)
  })
})

function stackedBarVisualize(data) {
  const margin = { top: 10, right: 20, bottom: 30, left: 115 }
  const width = 1000
  const height = 1000

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
  console.log(produceSet)
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
    height: 15,
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
      console.log(d['Percent Consumed'] + ' -> ' + percentScale(d['Percent Consumed']))
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