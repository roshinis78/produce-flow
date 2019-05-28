var Popper = require('popper.js')
var locationLookup = {}

$(function () {
  // intialize the location lookup table
  d3.csv('data/countries_lookup.csv').then(function (data) {
    data.forEach(function (country, index) {
      locationLookup[country.name] = { 'latitude': country.latitude, 'longitude': country.longitude }
    })
    console.log('Printing location lookup table...')
    console.log(locationLookup)
  });

  d3.csv('data/avacados_2012_top10_export.csv').then(function (data) {
    console.log(data); // debugging
    visualize(data);
  });
});

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})

var viewClass = 'avacados_2012_top10_export'

var visualize = function (data) {
  // Boilerplate:
  var margin = { top: 0, right: 0, bottom: 50, left: 60 };
  var width = 1100 - margin.left - margin.right;
  var height = 600 - margin.top - margin.bottom;

  var svg = d3.select('#chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // Visualization Code:

  // world map
  var worldGeoJSON = require('./data/countries.json')
  var projection = d3.geoEquirectangular()
  var pathGenerator = d3.geoPath(projection)
  var mapPalette = ['#a1c9f4',
    '#ffb482',
    '#8de5a1',
    '#ff9f9b',
    '#d0bbff',
    '#debb9b',
    '#fab0e4',
    '#cfcfcf',
    '#fffea3',
    '#b9f2f0',
    '#a1c9f4',
    '#ffb482',
    '#8de5a1',
    '#ff9f9b',
    '#d0bbff']

  svg
    .selectAll('countries')
    .data(worldGeoJSON.features)
    .enter()
    .append('path')
    .attr('d', pathGenerator) // d attribute defines the shape of the path
    .style('stroke', 'white')
    .style('fill', function (d, i) {
      // randomly select color from palette
      return mapPalette[Math.floor(Math.random() * mapPalette.length)]
    })

  var map = {
    top: 0,
    right: 960,
    left: 0,
    bottom: 489
  }

  // axes
  var latitudeScale = d3
    .scaleLinear()
    .domain([-90, 90])
    .range([map.bottom, map.top])
  var latitudeAxis = d3.axisLeft(latitudeScale)

  var longitudeScale = d3
    .scaleLinear()
    .domain([-180, 180])
    .range([map.left, map.right])
  var longitudeAxis = d3.axisBottom(longitudeScale)

  svg
    .append('g')
    .call(latitudeAxis)

  svg
    .append('g')
    .call(longitudeAxis)
    .attr('transform', 'translate(0,' + map.bottom + ')')

  // read dataset, add a circle for each element
  svg
    .selectAll('exercise')
    .data(data)
    .enter()
    .append('circle')
    .attr('r', function (d, i) {
      var tooltip = new Tooltip(this, {
        title: "Hello roshini :)",
        placement: "bottom"
      })
      return 2
    })
    .attr('cx', function (d, i) {
      return longitudeScale(locationLookup[d['Country']].longitude)
    })
    .attr('cy', function (d, i) {
      return latitudeScale(locationLookup[d['Country']].latitude)
    })
    .attr('class', viewClass)

  // tooltips

};