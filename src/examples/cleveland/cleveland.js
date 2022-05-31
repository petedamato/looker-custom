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
    if (!handleErrors(this, queryResponse, {
      min_pivots: 0, max_pivots: 0,
      min_dimensions: 1, max_dimensions: undefined,
      min_measures: 2, max_measures: 2
    })) return

    let colors; 
    let fills = ['#d4dde2','#fdf7eb']

    if (config.color_reverse == "reversed") {
      colors = config.color_range.reverse();
      fills = fills.reverse();
    } else {
      colors = config.color_range;
      fills = fills;
    }

    const margin = {
      top: 10,
      bottom: 70,
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

    const line1 = d3.area()
        .curve(d3.curveBasis)
        .x(function(d) { return x(d[dimension.name]["value"]); })
        .y(function(d) { return y(d[measures[0].name]["value"]); });

    const line2 = d3.area()
        .curve(d3.curveBasis)
        .x(function(d) { return x(d[dimension.name]["value"]); })
        .y(function(d) { return y(d[measures[1].name]["value"]); });

    const area = d3.area()
        .curve(d3.curveBasis)
        .x(function(d) { return x(d[dimension.name]["value"]); })
        .y1(function(d) { return y(d[measures[0].name]["value"]); });

      const xAxis = d3.axisBottom(x).tickSize(0);
      const yAxis = d3.axisLeft(y).tickSize(0).ticks(5).tickFormat(d3.format("$,d"));
      const yGridlines = d3.axisLeft(y)
            .tickSize(-width,0,0)
            .tickFormat("");

    if (config.chart_type == "dot") {
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
      } else if (config.chart_type == "area") {
              svg.datum(data);

              svg.append("clipPath")
                  .attr("id", "clip-below")
                .append("path")
                  .attr("d", area.y0(height));

              svg.append("clipPath")
                  .attr("id", "clip-above")
                .append("path")
                  .attr("d", area.y0(0));

              svg.append("path")
                  .attr("class", "area above")
                  .attr("clip-path", "url(#clip-above)")
                  .attr("d", area.y0(function(d) { return y(d[measures[1].name]["value"]); })).attr("transform", "translate(" + x.bandwidth()/2+ ",0)")
                  .attr("fill", fills[1])

              svg.append("path")
                  .attr("class", "area below")
                  .attr("clip-path", "url(#clip-below)")
                  .attr("d", area).attr("transform", "translate(" + x.bandwidth()/2+ ",0)")
                  .attr("fill", fills[0]);

              svg.append("path")
                  .attr("class", "line1")
                  .attr("d", line1).attr("transform", "translate(" + x.bandwidth()/2+ ",0)")
                  .attr("fill", "none")
                  .attr("stroke", colors[0])
                  .attr("stroke-width", 3);

              svg.append("path")
                  .attr("class", "line2")
                  .attr("d", line2).attr("transform", "translate(" + x.bandwidth()/2+ ",0)")
                  .attr("fill", "none")
                  .attr("stroke", colors[1])
                  .attr("stroke-width", 3);
      } 


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

        var legend = svg.selectAll(".legend")
        .data(colors)
      .enter()
        .append("g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { return "translate(" + ((i * 180) - width/2.05) + "," + (height + 50) + ")"; });
    
        legend.append("circle")
            .attr("cx", width - 12)
            .attr("cy", 9)
            .attr("r", 7)
            .style("fill", (d)=>{
              return d 
            });

        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .style("font-size",10)
            .text((d,i)=>{
              return measures[i].name
              });


    // // Throw some errors and exit if the shape of the data isn't what this chart needs

        if (queryResponse.fields.dimensions.length == 0) {
          this.addError({title: "No Dimensions", message: "This chart requires dimensions."});
          return;
        } else if (config.chart_type == "area" && config.chart_type == "dot") {
          this.addError({title: "No Chart Type", message: "Select either Area or Dot from the options."});
          return;
        } else if (queryResponse.fields.measures.length < 2 || queryResponse.fields.measures.length > 2) {
          this.addError({title: "Measure Error", message: "This chart type can only display two measures at a time."});
          return;
        } 
    // We are done rendering! Let Looker know.
    done()
  }
});
