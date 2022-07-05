import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker.

    id: "line-chart",
    label: "ZDev Line Chart",
    options: {
        moving_average: {
          type: 'string',
          label: 'Moving Average',
          display: "radio",
          values: [
            {"Yes": "yes"},
            {"No": "no"}
          ],
          default: "yes"
        },
        currency_type: {
          type: 'string',
          label: 'Currency Prefix',
          display: "radio",
          values: [
            {"USD": "dollar"},
            {"None": "none"}
          ],
          default: "dollar"
        },
        index_start: {
          type: 'string',
          label: 'Index Option',
          display: "radio",
          values: [
            {"one": "0"},
            {"two": "1"},
            {"three": "2"}
          ],
          default: "0"
        }
      },

    // Set up the initial state of the visualization
    create: function(element, config) {
        // Insert a <style> tag with some styles we'll use later
        element.innerHTML = `
            <style>
              body {
                  font-family: Arial;
                  font-size: 12px;
              }
                  .only-line {
                    fill: none;
                    stroke: #27566b;
                    stroke-width: 2px;
                  }
                  .line {
                    fill: none;
                    stroke: #27566b;
                    stroke-width: 2px;
                    opacity: .2;
                  }
                  .budget-line {
                          fill: none;
                          stroke: #339f7b;
                          stroke-width: 2px;
                          stroke-dasharray:4;
                        }
                  .forecast-line {
                          fill: none;
                          stroke: #8cbb61;
                          stroke-width: 2px;
                          stroke-dasharray:4;
                        }
                  .moving {
                    fill: none;
                    stroke: #27566b;
                    stroke-width: 2px;
                  }

            </style>
            <svg>
            </svg>`;
        element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`
    },

    // Render in response to the data or settings changing
    updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
        if (environment == "prod") {
            if (!handleErrors(this, queryResponse, {
                min_pivots: 0, max_pivots: 0,
                min_dimensions: 0, max_dimensions: 20,
                min_measures: 0, max_measures: 20
            })) return
        }
    
    try {
        console.log(config)
    var parseTimeDay = d3.timeParse("%Y-%m-%d");
    var parseTimeMonth = d3.timeParse("%Y-%m");

    var parseTime;

    const dimensions_ordered = queryResponse.fields.dimension_like
    const measures_ordered = queryResponse.fields.measure_like

    if (parseTimeDay(data[1][dimensions_ordered[0].name].value)) {
      parseTime = parseTimeDay
    } else {
      parseTime = parseTimeMonth
    }
    const colors = ["#27566b", "#007b82", "#8cbb61"]
    const index_options = ["0","3","12"]
    let data1 = []
    let data2 = []
    let data3 = []

    index_options.forEach(function(j, index) {
      data.forEach(function(d) {

        const data_pod = {};
        if (parseTime(d[dimensions_ordered[0].name].value) == null) {
          return
        }
        const num = +config.index_start + (+j)

        data_pod["date"] = parseTime(d[dimensions_ordered[0].name].value);

        data_pod["value"] = d[measures_ordered[num].name].value;

        if (index == 0) {
          data1.push(data_pod)
        } else if (index == 1) {
          data2.push(data_pod)
        } else {
          data3.push(data_pod)
        }
      })
    })

    data1.sort(function(a,b){
      return b.date - a.date
    })

    data2.sort(function(a,b){
      return b.date - a.date
    })

    data3.sort(function(a,b){
      return b.date - a.date
    })
    // console.log(data1, data2, data3)
    // first we set the dimensions and margins of the graphic
        const margin = {top: 40, right: 20, bottom: 66, left: 60};
        const width = element.clientWidth - margin.left - margin.right;
        const height = element.clientHeight - margin.top - margin.bottom;

    // parseTime becomes a function using the d3.timeParse() function, it's to make the dates
    // in our csv file readable to our machine

    var x = d3.scaleTime().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    var line = d3.line()
          .defined(function(d) { return d.value != null && d.value != 0 && x(d.date) >= 0})
          .curve(d3.curveBasis)
          .x(function(d) {
            return x(d.date);})
          .y(function(d) {
              return y(d.value);
            })

    var movingLine = d3.line()
          .defined(function(d) { return d.value != null && x(d.date) >= 0})
          .curve(d3.curveBasis)
          .x(function(d) {
            return x(d.date);})
          .y(function(d) {
              return y(d.value);
            })

    const POINTS_AVERAGE = 7;

    let movingData = []

    data3.forEach(function(d, index) {
      const data_pod = {};

      let r;
      let avg = 0
      for (let j = 0; j <= POINTS_AVERAGE; j++) {

          if ((index - j) >= 0) {
            if (data1[index - j].value == null) {
              return
            }
            avg += data3[index - j].value;
            r = Math.floor(avg / (j + 1));
          } else {

            r = Math.floor(avg / j);
            j = POINTS_AVERAGE + 1;
          }
        }
      data_pod["date"] = d.date
      data_pod["value"] = r
      movingData.push(data_pod)
    })

        const svg = (
          d3.select(element).select('svg')
            .html('')
            .attr('width', '100%')
            .attr('height', '100%')
        )

        const group = svg.append('g')
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .attr("width", "100%")
            .attr("height", ((height - margin.top - margin.bottom) + "px"))
                .classed("group", true)


    // The d3.csv function gets the data and returns it, we iterate over each part of that
    // data object to transform it into machine-readable data



      // Here we set the domains
      x.domain(d3.extent(data1, function(d) { return d.date; }));
      y.domain(d3.extent(data1, function(d) { return d.value; }));

      const rawLine = group.append("path")
          .data([data3])
          .attr("class", "only-line")
          .attr("d", line);

      const budgetLine = group.append("path")
          .data([data1])
          .attr("class", "budget-line")
          .attr("d", line);

      const forecastLine = group.append("path")
          .data([data2])
          .attr("class", "forecast-line")
          .attr("d", line);

      if (config.moving_average == "yes") {
          group.append("path")
            .data([movingData])
            .attr("class", "moving")
            .attr("d", movingLine);

          rawLine.attr("class", "line");
      } else {
        const newRawLine = group.append("path")
          .data([data3])
          .attr("class", "only-line")
          .attr("d", line);

      }
      var legend = group.selectAll(".legend")
        .data(colors)
      .enter()
        .append("g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { return "translate(" + (-100 + (i * 110) - width/2) + "," + (height + margin.bottom/2.3) + ")"; });

            legend.append("rect")
                .attr("x", width - 12)
                .attr("y", 9)
                .attr("height", 8)
                .attr("width", 19)
                .style("fill", (d,i)=>{
                  return colors[i] 
                })
                .attr("opacity", (d,i)=>{
                    if (i != 0) {
                        return 0
                    }
                });

            legend.append("rect")
                .attr("x", width - 12)
                .attr("y", 9)
                .attr("height", 8)
                .attr("width", 5)
                .style("fill", (d,i)=>{
                  return colors[i] 
                })
                .attr("opacity", (d,i)=>{
                    if (i == 0) {
                        return 0
                    } else {
                        return .8
                    }
                });
            legend.append("rect")
                .attr("x", width - 5)
                .attr("y", 9)
                .attr("height", 8)
                .attr("width", 5)
                .style("fill", (d,i)=>{
                  return colors[i] 
                })
                .attr("opacity", (d,i)=>{
                    if (i == 0) {
                        return 0
                    } else {
                        return .8
                    }
                });
            legend.append("rect")
                .attr("x", width + 2)
                .attr("y", 9)
                .attr("height", 8)
                .attr("width", 5)
                .style("fill", (d,i)=>{
                  return colors[i] 
                })
                .attr("opacity", (d,i)=>{
                    if (i == 0) {
                        return 0
                    } else {
                        return .8
                    }
                });

            legend.append("text")
                .attr("x", width - 22)
                .attr("y", 13)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .style("font-size",10)
                .text((d,i)=>{
                  const arr = ["Actual", "Target", "Forecast"]
                  return arr[i]
                  });

      // Add the x Axis
      group.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x).ticks(4));

      // Add the y Axis
      if (config.currency_type == "dollar") {
        group.append("g")
            .call(d3.axisLeft(y).ticks(5).tickFormat((d)=>{
              if (d>=1000000) {
                return d3.format("$,")(d/1000000) + "M"
              } else {
                return d3.format("$,")(d)
              }
            }));

      } else {
        group.append("g")
          .call(d3.axisLeft(y).ticks(5).tickFormat((d)=>{
              if (d>=1000000) {
                return d3.format(",")(d/1000000) + "M"
              } else {
                return d3.format(",")(d)
              }
            }));

      }

        } catch(error) {
            if (environment == "prod") {
                if (queryResponse.fields.dimensions.length != queryResponse.fields.measures.length) {
                                    this.addError({title: "Data mismatch", message: "This chart requires dimension/measure pairs."});
                                    return;
                                } 
            } else {
                console.log(error)
            }
            
        }


        // Callback at the end of the rendering to let Looker know it's finished
        done()
    }
})