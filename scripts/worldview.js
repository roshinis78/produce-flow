// *************************************************************************************
// *                          © 2019 Roshini Saravanakumar                             *
// *************************************************************************************

// global lookup table used to look up the location of the centroid of a country
var locationLookup = {}

// global variables to store the viz d3 selection, geoJSON map data and projection for redraws on query
var svg = null
var worldGeoJSON = require('../data/countries.json')
var projection = d3.geoMercator().fitWidth(1100, worldGeoJSON).translate([550, 280])

// value resulting from a fulfilled promise from the completion of d3.csv('../data/relevant_data.csv)
// basically the csv that is read as an object
var fulfillmentValue = null

var type = 'Import' // 'Import', 'Export', 'Production'
var produce = 'Avocados'
var year = '2012'

// called whenever the user submits a query to update the viz
function updateViz() {
  var newType = document.getElementById('role-select').value
  var newProduce = document.getElementById('produce-select').value
  var newYear = document.getElementById('year-select').value

  // only update when the query has changed
  if (newType == type && newProduce == produce && newYear == year) {
    console.log('No update necessary!')
    return
  }

  type = newType
  produce = newProduce
  year = newYear
  drawViz(fulfillmentValue)
  console.log('Viz redrawn!')
}

// called whenever the user presses the toggle button
function updateStatsToggle() {
  var toggleButton = document.getElementById('toggle-stats-button')

  if (toggleButton.innerHTML == 'Show Summary <i class="fa fa-chevron-down"></i>') {
    // summary will be shown, so set button to 'hide summary'
    toggleButton.innerHTML = 'Hide Summary <i class="fa fa-chevron-up"></i>'
    toggleButton.setAttribute('class', 'ml-auto btn btn-danger')
  }
  else {
    // summary will be hidden, so set button to 'show summary'
    toggleButton.innerHTML = 'Show Summary <i class="fa fa-chevron-down"></i>'
    toggleButton.setAttribute('class', 'ml-auto btn btn-success')
  }
}

// called whenever the option selected by the user in the produce select menu changes
function updateYearOptions() {
  // get all the years for which data is available for the given produce
  var produceSelect = document.getElementById('produce-select')
  var years = fulfillmentValue.filter(entry => (entry['Produce'] == produceSelect.value))
  years = Array.from(new Set(years.map(entry => entry['Year'])))

  // update the year select menu's options
  var yearSelect = document.getElementById('year-select')
  while (yearSelect.firstChild) {
    yearSelect.removeChild(yearSelect.firstChild)
  }

  var maintainYear = false // whether or not we can select the previously selected year
  years.forEach(function (localYear, index) {
    var option = document.createElement('option')
    option.setAttribute('value', localYear)
    option.innerHTML = localYear
    // if the previously selected year has data, ensure that it is selected
    if (localYear == year) {
      console.log('Data available for ' + year + '! Maintaining previously selected year!')
      maintainYear = true
      option.selected = true
    }
    yearSelect.appendChild(option)
  })

  // if the previously selected year does not have data for the new produce, default to the first available year
  if(!maintainYear){
    console.log('No data available for ' + year + '! Defaulting to data from ' + yearSelect.firstChild.innerHTML)
    yearSelect.firstChild.selected = true
    year = yearSelect.firstChild.innerHTML
  }

  updateViz()
}

// document.ready handler -- this fxn is called when the dom is ready
$(function () {
  // Add event listeners so we can update type, produce and year according to the user's query
  document.getElementById('role-select').addEventListener('change', updateViz)
  document.getElementById('year-select').addEventListener('change', updateViz)
  // Add event listener so we can update the year selection options and the visualization
  var produceSelect = document.getElementById('produce-select')
  // NOTE: UPDATE YEAR OPTIONS CALLS UPDATE VIZ
  produceSelect.addEventListener('change', updateYearOptions)

  // Add event listener so we can update design of toggle button
  var toggleButton = document.getElementById('toggle-stats-button')
  toggleButton.addEventListener('click', updateStatsToggle)

  // intialize the location lookup table
  d3.csv('../data/countries_lookup.csv').then(function (data) {
    data.forEach(function (country, index) {
      locationLookup[country.name] = { 'latitude': country.latitude, 'longitude': country.longitude, 'code': country.code }
    })
    console.log('Printing location lookup table...')
    console.log(locationLookup)
  });

  // fill the produce select element with produce options
  d3.csv('../data/produce.csv').then(function (data) {
    console.log('Printing produce set...')
    console.log(data)
    data.forEach(function (set) {
      var selectMenu = document.getElementById('produce-select')
      var option = document.createElement('option')
      option.setAttribute('value', set['Produce'])
      option.innerHTML = set['Produce']

      // set default produce selection
      if (set['Produce'] == produce) {
        option.selected = true;
      }

      selectMenu.appendChild(option)
    })
  });

  // fill the year select element with year options
  d3.csv('../data/years.csv').then(function (data) {
    console.log('Printing year set...')
    console.log(data)
    data.forEach(function (set) {
      var selectMenu = document.getElementById('year-select')
      var option = document.createElement('option')
      option.setAttribute('value', set['Year'])
      option.innerHTML = set['Year']

      // set default year selection
      if (set['Year'] == year) {
        option.selected = true;
      }

      selectMenu.appendChild(option)
    })
  });

  // request to read the csv and save the read data for future redraws
  d3.csv('../data/relevant_data.csv').then(function (data) {
    fulfillmentValue = data
    console.log('Printing fulfillment value of request to read relevanta_data.csv...')
    console.log(fulfillmentValue)

    // draw the map only once
    const width = 1100;
    const height = 520;

    svg = d3.select('#chart')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')

    // world map
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

    // draw the map based on the generated path for a Mercator projection
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

    // append a group element that will contain all non-map svg elts for easy removal
    svg = svg.append('g').attr('id', 'map-elements')

    // visualize data on map!! :D
    drawViz(data)
  })
});

var drawViz = function (data) {
  // get the top 10 (ideally) importers/exporters/producers of a produce from a specific year
  var topHowMany = 10
  data = data.filter(row => ((row['Produce'] == produce) && (row['Year'] == year) && (row[type + ' Quantity'] > 0)))
  data.sort(function (a, b) { return b[type + ' Quantity'] - a[type + ' Quantity'] })

  // if there is no data available for this query, do not make any changes
  if (data.length == 0) {
    return
  }

  if (data.length < 10) {
    topHowMany = data.length
  }
  data = data.slice(0, topHowMany)

  // clear any children of the map viz, top 10 list, popper storage
  var mapElements = document.getElementById('map-elements');
  if (mapElements != null) {
    while (mapElements.firstChild) {
      mapElements.removeChild(mapElements.firstChild)
    }
    var stats = document.getElementById('stats-body')
    while (stats.firstChild) {
      stats.removeChild(stats.firstChild)
    }
    var poppers = document.getElementById('poppers')
    while (poppers.firstChild) {
      poppers.removeChild(poppers.firstChild)
    }
  }

  // role of country in relation to the produce
  var countryRole = {
    'Import': ' Importers of ',
    'Export': ' Exporters of ',
    'Production': ' Producers of '
  }[type]

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

  // visualize data on map!
  visualize(data);

  // generate all tooltips set up by visualize function
  $('[data-toggle="tooltip"]').tooltip();
}

var visualize = function (data) {
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

      // add the popper with tooltip to a div so they can be easily removed when redrawing
      popperDiv = document.getElementById('poppers')
      popperDiv.appendChild(popper)

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