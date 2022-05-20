import * as d3 from 'd3'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({
  // Id and Label are legacy properties that no longer have any function besides documenting
  // what the visualization used to have. The properties are now set via the manifest
  // form within the admin/visualizations page of Looker
  id: "hello",
  label: "ZDev Hello",
  options: {
    color_range: {
      type: 'array',
      label: 'Color Range',
      display: 'colors',
      default: ['#27566b', '#ecd796']
    },
    color_reverse: {
      type: "string",
      label: "Reverse Colors?",
      values: [
        {"Original": "original"},
        {"Reversed": "reversed"}
      ],
      display: "radio",
      default: "original"
    },
    chart_type: {
      type: "string",
      label: "Chart Type",
      values: [
        {"Dot":"dot"},
        {"Area": "area"}
      ],
      display: "radio",
      default: "dot"
    }
  },
  // Set up the initial state of the visualization
  create: function(element, config) {
    // Insert a <style> tag with some styles we'll use later.
    element.innerHTML = `
      <style>
        .cleveland-text-large {
          font-size: 72px;
        }
        .cleveland-text-large {
          font-size: 18px;
        }
        .gridline {
          opacity:.1;
        }
      </style>`;
    element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`

    this.svg = d3.select(element).append('svg')
      .classed("this-thee-svg", true)

    // this.svg.append("text").text("Test")
  },
  // Render in response to the data or settings changing
  updateAsync: function(data, element, config, queryResponse, details, done) {
    console.log(config)
    if (!handleErrors(this, queryResponse, {
      min_pivots: 0, max_pivots: 0,
      min_dimensions: 1, max_dimensions: undefined,
      min_measures: 2, max_measures: 2
    })) return

    let colors; 

    if (options.color_reverse == "reversed") {
      colors = options.color_range.default.reverse();
    } else {
      colors = options.color_range.default;
    }

    const margin = {
      top: 10,
      bottom: 50,
      left: 40,
      right: 10
    };

    const width = element.clientWidth - margin.left - margin.right
    const height = element.clientHeight - margin.top - margin.bottom

    const dimension = queryResponse.fields.dimension_like[0]
    const measures = queryResponse.fields.measure_like


    // Clear any errors from previous updates
    this.clearErrors();

    const svg = (
      this.svg
      .html('')
      .attr('width', '100%')
      .attr('height', '100%')
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    )

   // TODO Add option to sort on gap between measures
   // data.sort(function(a,b){
   //    return (a[measures[0].name]["value"] - a[measures[1].name]["value"]) - (b[measures[0].name]["value"] - b[measures[1].name]["value"]);
   //  })

  const x = d3.scaleBand()
        .domain(data.map((entry)=>{
          return entry[dimension.name]["value"];
        }))
        .range([0, width]);

  const y = d3.scaleLinear()
        .domain([d3.min([
              d3.min(data, function(entry){
                return entry[measures[0].name]["value"]
              }),
              d3.min(data, function(entry){
                return entry[measures[1].name]["value"]
              })
              ]),
              d3.max([
                d3.max(data, function(entry){
                  return entry[measures[0].name]["value"]
                }), 
                d3.max(data, function(entry){
                  return entry[measures[1].name]["value"]
                })])
              ])
        .range([height,0]);

      const xAxis = d3.axisBottom(x).tickSize(0);
      const yAxis = d3.axisLeft(y).tickSize(0).ticks(5).tickFormat(d3.format("$,d"));
      const yGridlines = d3.axisLeft(y)
            .tickSize(-width,0,0)
            .tickFormat("");
          // gridlines
      svg.append("g")
        .call(yGridlines)
        .classed("gridline", true)
        .attr("transform", "translate(0,0)")
      svg.selectAll(".gap")
      .data(data)
      .enter()
        .append("line")
        .classed("gap", true)
        .style("stroke", "#91a1a8")
        .attr("x1", (d,i)=>{
            return (x(d[dimension.name]["value"]) + (x.bandwidth()/2))
          })     // x position of the first end of the line
          .attr("y1", (d,i)=>{
            return (y(d[measures[0].name]["value"]))
          })      // y position of the first end of the line
          .attr("x2", (d,i)=>{
            return (x(d[dimension.name]["value"]) + (x.bandwidth()/2))
          })     // x position of the second end of the line
          .attr("y2", (d,i)=>{
            return (y(d[measures[1].name]["value"]))
          });
    svg.selectAll(".dot")
      .data(data)
      .enter()
        .append("circle")
        .classed("dot", true)
        .attr("r", 8)
        .attr("cy", (d,i) => {
          return y(d[measures[0].name]["value"])
        })
        .attr("cx", (d,i) => {
          return (x(d[dimension.name]["value"]) + (x.bandwidth()/2))
        })
        .attr("fill", colors[0]);

    svg.selectAll(".lowdot")
      .data(data)
      .enter()
        .append("circle")
        .classed("lowdot", true)
        .attr("cy", (d,i) => {
          return y(d[measures[1].name]["value"])
        })
        .attr("cx", (d,i) => {
          return (x(d[dimension.name]["value"]) + (x.bandwidth()/2))
        })
        .attr("r", 8)
        .attr("fill", colors[1]);

      // axes
      svg.append("g")
        .classed("x axis", true)
        .attr("transform", "translate("+0+","+(height-1)+")")
        .call(xAxis)
        .selectAll("text")
          .style("text-anchor", "end")
          .attr("dx", -4)
          .attr("dy",10)
          .attr("transform", "rotate(-40)")
          .style("font-size",10);

      svg.append("g")
        .classed("y axis", true)
        .attr("transform", "translate("+0+","+0+")")
        .call(yAxis);

    // // Throw some errors and exit if the shape of the data isn't what this chart needs
    // if (queryResponse.fields.dimensions.length == 0) {
    //   this.addError({title: "No Dimensions", message: "This chart requires dimensions."});
    //   return;
    // }

    // We are done rendering! Let Looker know.
    done()
  }
});
