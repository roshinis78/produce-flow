$(function () {
  d3.csv('data/relevant_data.csv').then(function (data) {
    console.log(data); // debugging
    visualize(data);
  });
});


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

  svg
    .selectAll('countries')
    .data(worldGeoJSON.features)
    .enter()
    .append('path')
    .attr('d', pathGenerator) // d attribute defines the shape of the path
    .style('stroke', 'white')
    .style('fill', '#81D4FA')

  var map = {
    top: 0,
    right: 960,
    left: 0,
    bottom: 490
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
};