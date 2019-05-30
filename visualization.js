// global lookup table used to look up the location of the centroid of a country
var locationLookup = {}

// value resulting from a fulfilled promise from the completion of d3.csv('data/relevant_data.csv)
// basically the csv that is read as an object
var fulfillmentValue = null

var type = 'Import' // 'Import', 'Export', 'Production'
var produce = 'Avocados'
var year = '2012'
function updateViz() {
  type = document.getElementById('role-select').value
  console.log('Updated type to ' + type)

  produce = document.getElementById('produce-select').value
  console.log('Updated produce to ' + produce)

  year = document.getElementById('year-select').value
  console.log('Updated year to ' + year)

  drawViz(fulfillmentValue)
  console.log('Viz redrawn!')
}

$(function () {
  // Add event listener so we can update type, produce and year according to the user's query
  queryButton = document.getElementById('query-button')
  queryButton.addEventListener('click', updateViz)

  // intialize the location lookup table
  d3.csv('data/countries_lookup.csv').then(function (data) {
    data.forEach(function (country, index) {
      locationLookup[country.name] = { 'latitude': country.latitude, 'longitude': country.longitude, 'code': country.code }
    })
    console.log('Printing location lookup table...')
    console.log(locationLookup)
  });

  // fill the produce select element with produce options
  d3.csv('data/produce.csv').then(function (data) {
    console.log('Printing produce set...')
    console.log(data)
    data.forEach(function (produce) {
      var selectMenu = document.getElementById('produce-select')
      var option = document.createElement('option')
      option.setAttribute('value', produce['Produce'])
      option.innerHTML = produce['Produce']
      selectMenu.appendChild(option)
    })
  });

  // fill the year select element with year options
  d3.csv('data/years.csv').then(function (data) {
    console.log('Printing year set...')
    console.log(data)
    data.forEach(function (year) {
      var selectMenu = document.getElementById('year-select')
      var option = document.createElement('option')
      option.setAttribute('value', year['Year'])
      option.innerHTML = year['Year']
      selectMenu.appendChild(option)
    })
  });

  // request to read the csv and save the read data for future redraws
  d3.csv('data/relevant_data.csv').then(function (data) {
    fulfillmentValue = data
    console.log('Printing fulfillment value of request to read relevanta_data.csv...')
    console.log(fulfillmentValue)

    // visualize!! :D
    drawViz(data)
  })
});

var drawViz = function (data) {
  // clear any children of the map viz and top 10 list
  map = document.getElementById('chart')
  while (map.firstChild) {
    map.removeChild(map.firstChild)
  }
  stats = document.getElementById('stats-body')
  while (stats.firstChild) {
    stats.removeChild(stats.firstChild)
  }

  // role of country in relation to the produce
  var countryRole = {
    'Import': ' Importers of ',
    'Export': ' Exporters of ',
    'Production': ' Producers of '
  }[type]

  var topHowMany = 10

  // get the top 10 (ideally) importers/exporters/producers of a produce from a specific year
  data = data.filter(row => ((row['Produce'] == produce) && (row['Year'] == year)))
  data.sort(function (a, b) { return b[type + ' Quantity'] - a[type + ' Quantity'] })
  if (data.length < 10) {
    topHowMany = data.length
  }
  data = data.slice(0, topHowMany)

  // nitty gritty grammar details for single top country ^^;
  if (topHowMany == 1) {
    topHowMany = ''
    countryRole = {
      'Import': ' Importer of ',
      'Export': ' Exporter of ',
      'Production': ' Producer of '
    }[type]
  }

  // debugging
  console.log('Printing Top ' + topHowMany + countryRole + produce + ' in ' + year + '...')
  console.log(data);

  // set the header of the stats card
  header = document.getElementById('stats-header')
  header.innerHTML = 'Top ' + topHowMany + countryRole + produce + ' in ' + year

  // visualize on map!
  visualize(data);

  // generate all tooltips set up by visualize function
  $('[data-toggle="tooltip"]').tooltip();
}

var visualize = function (data) {
  const width = 1100;
  const height = 540;

  var svg = d3.select('#chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')

  // Visualization Code:
  // world map
  var worldGeoJSON = require('./data/countries.json')
  var projection = d3.geoMercator().fitWidth(1100, worldGeoJSON).translate([550, 280])
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
    .selectAll('top-ten')
    .data(data)
    .enter()
    .append('circle')
    .attr('r', function (d, i) {
      // verb form
      var verb = {
        'Import': ' imported ',
        'Export': ' exported ',
        'Production': ' produced '
      }[type]

      // position tooltip hook - the element that the tooltip hooks on to,
      // which in this case is a font awesome number icon
      var popper = document.createElement('a')
      new Popper(this, popper, {
        placement: 'right',
      })
      popper.innerHTML = '<span class="fa-stack"><i class="fa fa-square fa-stack-1x fa-lg"></i><i class="fa fa-inverse fa-stack-1x number-style">'
        + (i + 1) + '</i></span>'

      // create the tooltip
      popper.setAttribute('data-toggle', 'tooltip')
      popper.setAttribute('data-placement', 'left')
      popper.setAttribute('title', d['Country'] + verb + parseInt(d[type + ' Quantity']) + ' ' + produce.toLowerCase())
      popper.setAttribute('class', 'my-tooltip')
      document.body.appendChild(popper)

      // dynamically update the top 10 list of importer/exporters/producers
      var listElt = document.createElement('li')
      listElt.setAttribute('class', 'list-group-item')
      listElt.innerHTML =
        '<span class="fa-stack">' +
        '<i class="fa fa-square fa-stack-2x"></i>' +
        '<i class="fa fa-inverse fa-stack-1x number-style">' + (i + 1) + '</i></span>' + ' ' +
        '<strong class="country-name">' + d['Country'] + '</strong>' +
        verb + parseInt(d[type + ' Quantity']) + ' ' + produce.toLowerCase()

      var top10 = document.getElementById('stats-body')
      top10.appendChild(listElt)

      // return radius of country centroid point
      return 3
    })
    .attr('cx', function (d, i) {
      // longitude projected
      return (projection([locationLookup[d['Country']].longitude, locationLookup[d['Country']].latitude]))[0]
    })
    .attr('cy', function (d, i) {
      // latitude projected
      return (projection([locationLookup[d['Country']].longitude, locationLookup[d['Country']].latitude]))[1]
    })
};