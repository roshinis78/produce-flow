// function to change the view class
var viewClass = 'avacados_2012_top10_export'
function changeView() {
  var view = 0
  viewClass = { 0: 'avacados_2012_top10_export', 1: 'avacados_2012_top10_import', 2: 'top10_overall' }[view]
  console.log(viewClass)
}

var locationLookup = {} // global lookup table used to look up the location of the centroid of a country

var produce = 'Potatoes'
var year = '2004'

var codes = null

$(function () {
  // intialize the location lookup table
  d3.csv('data/countries_lookup.csv').then(function (data) {
    data.forEach(function (country, index) {
      locationLookup[country.name] = { 'latitude': country.latitude, 'longitude': country.longitude, 'code': country.code }
    })
    console.log('Printing location lookup table...')
    console.log(locationLookup)
  });

  d3.csv('data/relevant_data.csv').then(function (data) {
    // save their country codes for later lookups
    codes = new Set(data.map(row => row['Country']))
    // get the top 10 exporters of a produce from a specific year
    data = data.filter(row => ((row['Produce'] == produce) && (row['Year'] == year)))
    data.sort(function (a, b) { return b['Export Quantity'] - a['Export Quantity'] })
    data = data.slice(0, 10)

    // debugging
    console.log('Printing Top 10 Exporters of ' + produce + ' in ' + year + '...')
    console.log(data);
    console.log('Printing their country codes...')
    console.log(codes);

    // Set the header of the stats card
    header = document.getElementById('stats-header')
    header.innerHTML = 'Top 10 Exporters of ' + produce + ' in ' + year

    // visualize the top 10 exporters
    visualize(data);
    $('[data-toggle="tooltip"]').tooltip(); // generate all tooltips
  });
});

var visualize = function (data) {
  const width = 855;
  const height = 530;

  var svg = d3.select('#chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')

  // Visualization Code:
  // world map
  var worldGeoJSON = require('./data/countries.json')
  var projection = d3.geoMercator().fitWidth(width, worldGeoJSON)
  var pathGenerator = d3.geoPath(projection)
  var mapPalette = ['#d7dfc0',
    '#c2d6af',
    '#aecfa2',
    '#98c698',
    '#82bc92',
    '#6fb08f',
    '#5fa38e',
    '#53958d',
    '#4a848b',
    '#437286',
    '#3f5f7f',
    '#3c4d73',
    '#393d65',
    '#342d53',
    '#2c1e3e']

  svg
    .selectAll('countries')
    .data(worldGeoJSON.features)
    .enter()
    .append('path')
    .attr('d', pathGenerator) // d attribute defines the shape of the path
    .style('stroke', 'white')
    .style('fill', function (d, i) {
      // randomly select color from palette
      // return mapPalette[Math.floor(Math.random() * mapPalette.length)]
      //console.log(d)
      if (!codes.has(d.properties['ADMIN'])) {
        console.log('NOT FOUND: ' + d.properties['ADMIN'])
      }
      return 'red'
    })

  // read dataset, add a circle for each element
  svg
    .selectAll('exercise')
    .data(data)
    .enter()
    .append('circle')
    .attr('r', function (d, i) {
      // create tooltip
      var popper = document.createElement('a')
      new Popper(this, popper, {
        placement: 'auto-end',
      })
      popper.innerHTML = '<span class="fa-stack"><i class="fa fa-square fa-stack-1x"></i><i class="fa fa-inverse fa-stack-1x number-style">'
        + (i + 1) + '</i></span>'
      popper.setAttribute('data-toggle', 'tooltip')
      popper.setAttribute('data-placement', 'left')
      popper.setAttribute('title', d['Country'] + ' exported ' + parseInt(d['Export Quantity']) + ' ' + produce.toLowerCase())
      popper.setAttribute('class', 'my-tooltip')
      document.body.appendChild(popper)

      // create a top 10 list of exporters
      var top10 = document.getElementById('stats-body')
      var entry = document.createElement('li')
      entry.innerHTML = '<span class="fa-stack"><i class="fa fa-square fa-stack-1x fa-lg"></i><i class="fa fa-inverse fa-stack-1x number-style">'
        + (i + 1) + '</i></span>' + ' ' + d['Country'] + ' exported ' + parseInt(d['Export Quantity']) + ' ' + produce.toLowerCase()
      entry.setAttribute('class', 'list-group-item')
      top10.appendChild(entry)

      // return radius
      return 2
    })
    .attr('cx', function (d, i) {
      return (projection([locationLookup[d['Country']].longitude, locationLookup[d['Country']].latitude]))[0] // longitude projected
    })
    .attr('cy', function (d, i) {
      return (projection([locationLookup[d['Country']].longitude, locationLookup[d['Country']].latitude]))[1] // latitude projected
    })
    .attr('class', viewClass)
};