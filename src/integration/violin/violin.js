import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker
    id: "violin",
    label: "ZDev Violin",
    options: {
      thresholds: {
        type: 'string',
        label: '# Thresholds',
        display: "radio",
        values: [
          {"5": "5"},
          {"10": "10"},
          {"15": "15"},
          {"20": "20"},
          {"25": "25"},
          {"30": "30"}
        ],
        default: "15",
        section: "Custom Options",
      },
      statistics: {
        type: 'string',
        label: 'Show Statistic',
        display: "radio",
        values: [
          {"Mean": "mean"},
          {"Median": "median"},
          {"None": "none"}
        ],
        default: "mean",
        section: "Custom Options",
      },
      // one_color: {
      //     type: "boolean",
      //     label: "Use 1 Color",
      //     default: true,
      //     section: "Custom Options"
      // },
      colors: {
          type: "array",
          label: "Color Palette",
          default: ["#27566b", "#8cbb61", "#007b82", "#f1cc56", "#339f7b", "#d3d3d3"],
          display: "color",
          section: "Custom Options"
      },
      show_xaxis_name: {
          type: "boolean",
          label: "Show X-Axis Name",
          default: true,
          section: "X"
      },
      xaxis_label: {
          type: "string",
          label: "X-Axis Label",
          display: "text",
          default: "",
          section: "X"
      },
      xticklabels_show: {
          type: "boolean",
          label: "Show X Tick Labels",
          default: true,
          section: "X"
      },
      xticklabel_format: {
          type: "string",
          label: "X Tick Time Label Format",
          display: "text",
          default: "%b",
          section: "X"
      },
      x_gridlines: {
          type: "boolean",
          label: "Show X Gridlines",
          default: false,
          section: "X"
      },
      // show_yaxis: {
      //     type: "string",
      //     label: "Show Y-Axis",
      //     display: "radio",
      //     values: [
      //         {"Yes": "yes"},
      //         {"No": "no"}
      //     ],
      //     default: "yes",
      //     section: "Axes"
      // },
      show_yaxis_name: {
          type: "boolean",
          label: "Show Y-Axis Name",
          default: true,
          section: "Y"
      },
      yaxis_label: {
          type: "string",
          label: "Y-Axis Label",
          display: "text",
          default: "",
          section: "Y"
      },
      yticklabels_show: {
          type: "boolean",
          label: "Show Y Tick Labels",
          default: true,
          section: "Y"
      },
      yticklabel_format: {
          type: "string",
          label: "Y Tick Value Format",
          display: "text",
          default: ",",
          placeholder: "#,###",
          section: "Y"
      },
      y_gridlines: {
          type: "boolean",
          label: "Show Y Gridlines",
          default: false,
          section: "Y"
      },
      unpin_y: {
          type: "boolean",
          label: "Unpin Y-Axis from 0",
          default: true,
          section: "Y"
      }
    },
    // Set up the initial state of the visualization
    create: function(element, config) {
      // Insert a <style> tag with some styles we'll use later.
      element.innerHTML = `
        <style>
          body {
            font-family: Arial;
            font-size: 12px;
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
          min_pivots: 1, max_pivots: 1,
          min_dimensions: 1, max_dimensions: 1,
          min_measures: 1, max_measures: 1
          })) return
      }
  
      function find_median(numbers) {
          const sorted = Array.from(numbers).sort((a, b) => a - b);
          const middle = Math.floor(sorted.length / 2);
  
          if (sorted.length % 2 === 0) {
              return (sorted[middle - 1] + sorted[middle]) / 2;
          }
  
          return sorted[middle];
      }
  
      try {
  
          let left_margin;
          let bottom_margin;
  
          if (config.show_yaxis_name == true) {
              left_margin = 80
          } else {
              left_margin = 60
          }
  
          if (config.show_xaxis_name == true) {
              bottom_margin = 50
          } else {
              bottom_margin = 30
          }
  
          const margin = {
              top: 10, 
              right: 10, 
              bottom: bottom_margin, 
              left: left_margin
          };
  
          console.log("margin", margin)
  
          const width = element.clientWidth - margin.left - margin.right;
          const height = element.clientHeight - margin.top - margin.bottom; 
      
          const svg = (
              d3.select(element).select('svg')
                  .html('')
                  .attr('width', '100%')
                  .attr('height', '100%')
              )
  
          const group = svg.append('g')
              .attr('transform', `translate(${margin.left}, ${margin.top})`)
              .attr('width', "100%")
              .attr('height', (height + "px"))
              .classed("group", true)
  
          // Get the shape of the data, this chart can take two dimensions or a pivot on the shorter dimension
          const dimensions = queryResponse.fields.dimension_like
          const measure = queryResponse.fields.measure_like[0]
          const pivots = queryResponse.fields.pivots
  
          const dateDict = {
              month: "%Y-%m",
              year: "%Y",
              week: "%Y-%m-%d",
              day: "%Y-%m-%d",
              null: null
          }
  
          let pivotDate;
          if (pivots[0].time_interval) {
              if (["day", "week", "month", "year"].includes(pivots[0].time_interval.name)) {
                  pivotDate = pivots[0].time_interval.name
              } else {
                  pivotDate = null
              }
          } else {
              pivotDate = null
          }
  
          const parseTime = d3.timeParse(dateDict[pivotDate])
  
          console.log("dimensions, measures, pivots", dimensions, measure, pivots)
  
          let data_ready = []
  
              const pivot_name = pivots[0].name
              const pivot_column_labels = queryResponse.pivots
  
              data.forEach((d)=>{
                  const keys = Object.keys(d[measure.name])
                  keys.forEach(function(val) {
                      if (d[measure.name][val].value != null) {
                          let entry = {}
                          if (pivotDate) {
                              entry["group"] = parseTime(val)
                          } else {
                              entry["group"] = val
                          }
                          entry["to_measure"] = d[dimensions[0].name].value
                          entry["value"] = d[measure.name][val]["value"]
                          data_ready.push(entry)
                      }
                  })
                  
              });
  
          if (pivotDate) {
              data_ready.sort((a,b) => a.group - b.group)
          }
      
          console.log("data ready sorted", data_ready)
  
  
          // Clear any errors from previous updates
          // this.clearErrors();
  
          let buckets = {}
          buckets["label"] = pivots[0].label
          
          let bucket_data = []
          data_ready.forEach(function(d){
              if (bucket_data.includes(d.group)) {
                  return
              } else {
                  bucket_data.push(d.group)
              }
          })
  
          buckets["range"] = bucket_data
  
          // -------------------------------------------------------
          // SCALES
          const xScale = d3.scaleBand()
              .domain(buckets.range)
              .range([0, width])
              .padding(0.05)
  
          const yScale = d3.scaleLinear()
              .domain(d3.extent(data_ready, (d)=>{
                  return d.value
              }))
              .range([height, 0])
  
          // const zScale = d3.scaleOrdinal()
          //     .domain(buckets.range)
          //     .range(config.colors)
  
          // -------------------------------------------------------
          // BINS
          const binsGenerator = d3.histogram()
              .domain(yScale.domain())
              .value((d) => {
                  return d})
              .thresholds(+config.thresholds)
          
          const groupBins = d3.nest()
              .key(function(d){
                  return d.group
              })
              .rollup(function(r) {
              const input = r.map(function(g) { return g.value;})
              const bins = binsGenerator(input)   
              return(bins)
              })
              .entries(data_ready)
  
          let yMax = ""
          groupBins.forEach(function(value,key){
              yMax = (value.value.slice(-1)[0]["x0"])
          })
  
          let maxNum = 0
          groupBins.forEach((value, key) => {
  
              const findLengthFrom = value.value
              const flat = value.value.flat()
  
              value["mean"] = flat.reduce((acc, c) => {
              return acc + c;
              }, 0) / flat.length;
  
              value["median"] = find_median(flat)
              value["none"] = 0
  
              const lengths = findLengthFrom.map(function(a) {return a.length})
              const longest = d3.max(lengths)
              if (longest > maxNum) {maxNum = longest}
          })
  
          // -------------------------------------------------------
          // SCALES AGAIN
          if (config.unpin_y == true) {
              yScale.domain([d3.min(data_ready, (d)=>{
                  return d.value
                  }),yMax])
          } else {
              yScale.domain([0, yMax])
          }
          
          var xNum = d3.scaleLinear()
              .domain([-maxNum, maxNum])
              .range([0, xScale.bandwidth()])
  
  
          // -------------------------------------------------------
          // DRAW PERIPHERALS
          const xAxisGenerator = d3.axisBottom()
              .scale(xScale)
              .tickPadding(10)
  
          // x ticklabels
          if (config.xticklabels_show == true) {
              xAxisGenerator
                  .tickFormat(d3.timeFormat(config.xticklabel_format))
          } else {
              xAxisGenerator
                  .tickFormat("")
          }
  
          // x gridlines
          if (config.x_gridlines == true) {
              xAxisGenerator
                  .tickSize(-height)
          } else {
              xAxisGenerator
                  .tickSize(0)
          }
  
          const xAxis = group.append("g")
              .call(xAxisGenerator)
                  .style("transform", `translateY(${height}px)`)
                  .attr("class", "x-axis")
  
          d3.select(".x-axis .domain")
              .attr("stroke", "#ccd6eb")
              .attr("stroke-width", 1)
  
          if (config.xticklabels_show == true) {
              d3.selectAll(".x-axis .tick text")
                  .style("font-size", "12px")
                  .style("font-family", "sans-serif")
                  .style("color", "#3a4245")
          }
  
          if (config.x_gridlines == true) {
              d3.selectAll(".x-axis .tick line")
                  .attr("stroke", "#e6e6e6")
                  .attr("stroke-width", 1)
                  .attr("opacity", 1)
          }
  
  
  
          const yAxisGenerator = d3.axisLeft()
              .scale(yScale)
              .tickPadding(10)
  
          // y ticklabels
          if (config.yticklabels_show == true) {
              yAxisGenerator
                  .tickFormat(d3.format(config.yticklabel_format))
          } else {
              yAxisGenerator
                  .tickFormat("")
          }
  
          // y gridlines
          if (config.y_gridlines == true) {
              yAxisGenerator  
                  .tickSize(-width)
          } else {
              yAxisGenerator
                  .tickSize(0)
          }
  
          const yAxis = group.append("g")
              .call(yAxisGenerator)
              .attr("class", "y-axis")
  
          d3.select(".y-axis .domain")
              .attr("stroke", "none")
  
          if (config.yticklabels_show == true) {
               d3.selectAll(".y-axis .tick text")
                  .style("font-size", "12px")
                  .style("font-family", "sans-serif")
                  .style("color", "#3a4245")
          }
  
          if (config.y_gridlines == true) {
              d3.selectAll(".y-axis .tick line")
                  .attr("stroke", "#e6e6e6")
                  .attr("stroke-width", 1)
                  .attr("opacity", 1)
          }
  
              
          // AXIS LABELS
          if (config.show_xaxis_name == true) {
              const xAxisLabel = xAxis.append("text")
                  .attr("x", width/2)
                  .attr("y", (margin.bottom - 8))
                  .attr("fill", "#3a4245")
                  .style("font-size", "12px")
                  .style("font-family", "sans-serif")
                  .text(function() {
                      if (config.xaxis_label) {
                          return config.xaxis_label
                      } else {
                          return buckets.label
                      }
                  })
                  .style("text-anchor", "middle")
          }
  
          if (config.show_yaxis_name == true) {
              const yAxisLabel = yAxis.append("text")
                  .attr("x", (-height/2))
                  .attr("y", -margin.left + 18)
                  .attr("fill", "#3a4245")
                  .style("font-size", "12px")
                  .style("font-family", "Roboto")
                  .text(function() {
                      if (config.yaxis_label) {
                          return config.yaxis_label
                      } else {
                          return measure.label
                      }
                  })
                  .style("transform", "rotate(-90deg)")
                  .style("text-anchor", "middle")
          }
  
          // -------------------------------------------------------
          // DRAW DATA
  
          group.append("defs")
              .append("clipPath")
              .attr("id", "plot-area")
              .append("rect")
              .attr("x", 0)
              .attr("y", 0)
              .attr("width", width)
              .attr("height", height)
  
          const violins = group.selectAll(".violin")
              .data(groupBins)
              .enter()
              .append("g")
                  .attr("transform", function(d) {
                      return (`translate(` + xScale(d.key) +` ,0)`)
                  })
                  .attr("class", "violin")
                      .style("fill", config.colors)
              .append("path")
                  .datum(function(d) {
                          return (d.value)})
                  .style("stroke", "none")
                  .attr("d", d3.area()
                      .x0(function(d) {return xNum(-d.length)})
                      .x1(function(d) {return xNum(d.length)})
                      .y(function(d) {return yScale(d.x0)})
                      .curve(d3.curveCatmullRom))
                  .attr("clip-path", "url(#plot-area)")
              
          const stats_marker = group.selectAll(".rect")
              .data(groupBins)
              .enter()
              .append("g")
                  .attr("transform", function(d) {
                      return (`translate(` + xScale(d.key) +` ,0)`)
                  })
                  .attr("class", "rect")
                  .append("rect")
                      .attr("x", xScale.bandwidth()/4)
                      .attr("y", (d)=>{
                          return yScale(d[config.statistics])
                      })
                      .attr("width", xScale.bandwidth()/2)
                      .attr("height", 2)
                      .attr("fill", d => {
                          if (config.statistics == "none") {
                              return "none"
                          } else {
                              return "gray"
                          }
                      })
                      .attr("clip-path", "url(#plot-area)")
                      
  
      } catch(error) {
          if (environment == "prod") {
              console.log("somehow got in here")
              if (queryResponse.fields.dimensions.length > 2 || queryResponse.fields.dimensions.length < 1 || queryResponse.fields.dimensions.length == 1 && queryResponse.fields.pivots.length != 1 ) {
              this.addError({title: "Dimension/Pivot Error", message: "This chart takes two dimensions or one pivot on a single dimension."});
              return;
              } 
          }
      }
      
      // Callback at the end of the rendering to let Looker know it's finished
      done()
    }
  });