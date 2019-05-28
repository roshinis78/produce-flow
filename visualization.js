// function to change the view class
var viewClass = 'avacados_2012_top10_export'
function changeView() {
  var view = 0
  viewClass = { 0: 'avacados_2012_top10_export', 1: 'avacados_2012_top10_import', 2: 'top10_overall' }[view]
  console.log(viewClass)
}

var locationLookup = {} // global lookup table used to look up the location of the centroid of a country

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
    $('[data-toggle="tooltip"]').tooltip(); // generate all tooltips
  });
});



var visualize = function (data) {
  // Boilerplate:
  var margin = { top: 0, right: 0, bottom: 50, left: 60 };
  var width = 1100 - margin.left - margin.right;
  var height = 540 - margin.top - margin.bottom;

  var svg = d3.select('#chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // Visualization Code:

  // world map
  var worldGeoJSON = require('./data/countries.json')
  var projection = d3.geoMercator()
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
        placement: 'left',
      })
      popper.innerHTML = '<span class="fa-stack"><i class="fa fa-square fa-stack-1x fa-lg"></i><i class="fa fa-inverse fa-stack-1x number-style">'
        + (i + 1) + '</i></span>' + d['Country'] + '&nbsp;'
      popper.setAttribute('data-toggle', 'tooltip')
      popper.setAttribute('data-placement', 'top')
      popper.setAttribute('title', 'Exported ' + d['Export Quantity'] + ' avacados')
      document.body.appendChild(popper)

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