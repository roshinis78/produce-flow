// For bar graphs
$(function () {
  d3.csv('data/percents.csv').then(function () {
    console.log(data)

    visualize(data)
  })
})

function visualize(data) {
  console.log('visualizing!')
}