$(function () {
  d3.csv('relevant_data.csv').then(function (data) {
    console.log(data); // debugging
    visualize(data);
  });
});


var visualize = function (data) {
  // Boilerplate:
  var margin = { top: 50, right: 50, bottom: 50, left: 50 };
  var width = 960 - margin.left - margin.right;
  var height = 500 - margin.top - margin.bottom;

  var svg = d3.select('#chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // Visualization Code:
  svg
    .append('text')
    .attr('x', 0)
    .attr('y', 0)
    .text('Visualization goes here!')
};