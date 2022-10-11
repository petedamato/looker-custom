import * as d3 from 'd3'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({
  // Id and Label are legacy properties that no longer have any function besides documenting
  // what the visualization used to have. The properties are now set via the manifest
  // form within the admin/visualizations page of Looker
  id: "test",
  label: "ZDev Test",
  options: {
    // color_range: {
    //   type: 'array',
    //   label: 'Color Range',
    //   display: 'colors',
    //   default: ['#27566b', '#ecd796']
    // },
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
      label: "Interpolation",
      values: [
        {"Linear":"curveLinear"},
        {"Natural": "curveNatural"},
        {"Step": "curveStep"}
      ],
      display: "radio",
      default: "curveLinear"
    }
  },
  // Set up the initial state of the visualization
  create: function(element, config) {
    // Insert a <style> tag with some styles we'll use later.
    element.innerHTML = `
      <style>
        @font-face { 
            font-family: Roboto; 
            font-weight: 300; 
            font-style: normal;
            src: url('https://static-a.lookercdn.com/fonts/vendor/roboto/Roboto-Light-d6f2f0b9bd.woff') format('woff'),url('/fonts/vendor/roboto/Roboto-Light-d6f2f0b9bd.woff') format('woff');
          }
          @font-face { font-family: Roboto; font-weight: 400; font-style: normal;
            src: url('https://static-b.lookercdn.com/fonts/vendor/roboto/Roboto-Regular-5997dd0407.woff') format('woff'),url('/fonts/vendor/roboto/Roboto-Regular-5997dd0407.woff') format('woff');
          }
            @font-face { font-family: Roboto; font-weight: 500; font-style: normal;
            src: url('https://static-b.lookercdn.com/fonts/vendor/roboto/Roboto-Medium-e153a64ccc.woff') format('woff'),url('/fonts/vendor/roboto/Roboto-Medium-e153a64ccc.woff') format('woff');
          }
          @font-face { font-family: Roboto; font-weight: 700; font-style: normal;
            src: url('https://static-b.lookercdn.com/fonts/vendor/roboto/Roboto-Bold-d919b27e93.woff') format('woff'),url('/fonts/vendor/roboto/Roboto-Bold-d919b27e93.woff') format('woff');
          }
          body {
              font-family: Roboto;
              font-size: 12px;
          }
          .tick {
            font-family: Roboto;
          }
          .label {
            font-size: 10px;
          }
            .tooltip {
                color: white;
                /*box-shadow: 2px 2px 5px;*/
            }
        .gridline {
                stroke: rgb(230, 230, 230)!important;
                shape-rendering: crispEdges!important;
                stroke-opacity: .1!important;
            }
        .cleveland-text-large {
          font-size: 72px;
        }
        .cleveland-text-large {
          font-size: 18px;
        }
        .value-headers {
                font-size: 12px;
            }
            .value-headers-body {
                font-weight: 500;
            }
      </style>
      <svg>
      </svg>
      <div class="tooltip"></div>`;
    element.style.fontFamily = `Roboto,"Open Sans", "Helvetica", sans-serif`

  },
  // Render in response to the data or settings changing
  updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
    if (environment == "prod") {
      if (!handleErrors(this, queryResponse, {
        min_pivots: 0, max_pivots: 0,
        min_dimensions: 1, max_dimensions: undefined,
        min_measures: 2, max_measures: 2
      })) return
    }
    d3.select("#vis")
            .select("svg").html("")
    let colors; 
    let fills = ['#d4dde2','#d4dde2']

    colors = ['rgb(39, 86, 107)', 'rgb(140, 187, 97)']
    // TK
    if (config.color_reverse == "reversed") {
      colors = colors.reverse();
      fills = fills.reverse();
    } else {
      colors = colors;
      fills = fills;
    }

    const margin = {
      top: 10,
      bottom: 58,
      left: 40,
      right: 30
    };

    // const width = element.clientWidth - margin.left - margin.right
    // const height = element.clientHeight - margin.top - margin.bottom

    const dimension = queryResponse.fields.dimension_like[0]
    const measures = queryResponse.fields.measure_like

        const getNode = d3.select("#vis");

        // Update this once we have a better idea how Looker integration will look
        const new_node_width = getNode.select(function() { return this.parentNode; })
        const new_node_height = getNode.select(function() { return this.parentNode; })
        const w = new_node_width.node().getBoundingClientRect().width;
        const h = new_node_height.node().getBoundingClientRect().height;

        const width = w - margin.left - margin.right;
        const height = h - margin.bottom - margin.top;

      // append the svg object to the body of the page
      var svg = d3.select("#vis")
      .select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    // // Clear any errors from previous updates
    // this.clearErrors();

    // const svg = (
    //   this.svg
    //   .html('')
    //   .attr('width', '100%')
    //   .attr('height', '100%')
    //   .append('g')
    //   .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    // )

   // TODO Add option to sort on gap between measures
   // data.sort(function(a,b){
   //    return (a[measures[0].name]["value"] - a[measures[1].name]["value"]) - (b[measures[0].name]["value"] - b[measures[1].name]["value"]);
   //  })
  const parseTime = d3.timeParse("%Y-%m");

  const x = d3.scaleTime()
        .domain(d3.extent(data,(entry)=>{
          return parseTime(entry[dimension.name]["value"]);
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
              ])*.8,
              d3.max([
                d3.max(data, function(entry){
                  return entry[measures[0].name]["value"]
                }), 
                d3.max(data, function(entry){
                  return entry[measures[1].name]["value"]
                })])*1.2
              ])
        .range([height,0]);

    const bisectDate = d3.bisector(function(d) { 
      return parseTime(d[dimension.name]["value"]); }).left; 

    const line1 = d3.area()
        .curve(d3.curveLinear)
        .x(function(d) { 
          return x(parseTime(d[dimension.name]["value"])); })
        .y(function(d) { return y(d[measures[0].name]["value"]); });

    const line2 = d3.area()
        .curve(d3.curveLinear)
        .x(function(d) { return x(parseTime(d[dimension.name]["value"])); })
        .y(function(d) { return y(d[measures[1].name]["value"]); });

    const area = d3.area()
        .curve(d3.curveLinear)
        .x(function(d) { return x(parseTime(d[dimension.name]["value"])); })
        .y1(function(d) { return y(d[measures[0].name]["value"]); });

      const xAxis = d3.axisBottom(x).tickSize(0);
      const yAxis = d3.axisLeft(y).tickSize(0).ticks(5).tickFormat(d3.format(".0%"));
      const yGridlines = d3.axisLeft(y)
            .tickSize(-width,0,0)
            .tickFormat("");


      // axes
      svg.append("g")
        .classed("x axis", true)
        .attr("transform", "translate("+0+","+(height-1)+")")
        .call(xAxis)
        .selectAll("text")
          .style("text-anchor", "middle")
          .style("font-size",10);

      svg.append("g")
        .classed("y axis", true)
        .attr("transform", "translate("+0+","+0+")")
        .call(yAxis);

        svg.append("g")
            .call(yGridlines)
            .classed("gridline", true)
            .attr("transform", "translate(0,0)")

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
                .attr("d", area.y0(function(d) { return y(d[measures[1].name]["value"]); }))
                .attr("transform", "translate(" + 0 + ",0)")
                .attr("fill", fills[1])

            svg.append("path")
                .attr("class", "area below")
                .attr("clip-path", "url(#clip-below)")
                .attr("d", area).attr("transform", "translate(" + 0 + ",0)")
                .attr("fill", fills[0]);

            svg.append("path")
                .attr("class", "line1")
                .attr("d", line1).attr("transform", "translate(" + 0 + ",0)")
                .attr("fill", "none")
                .attr("stroke", colors[0])
                .attr("stroke-width", 3);

            svg.append("path")
                .attr("class", "line2")
                .attr("d", line2).attr("transform", "translate(" + 0 + ",0)")
                .attr("fill", "none")
                .attr("stroke", colors[1])
                .attr("stroke-width", 3);
    var focus = svg.append("g")                                // **********
      .style("display", "none");

      // create a tooltip
      const tooltip = d3.select(".tooltip")
        .attr("opacity", 0)
        .style("display", "none")
        .style("background-color", "#262d33")
        .style("border-radius", "2px")
        .style("padding", "5px")
        .style("position", "absolute")
        .style("pointer-events","none")
        .html("<div id='value-body'></div>")

    // // append the circle at the intersection               // **********
    focus.append("circle")                                 // **********
        .attr("class", "y0")                                // **********
        .style("fill", "none")                             // **********
        .style("stroke", "#8A9781")                           // **********
        .attr("r", 4);                                     // **********
            // // append the circle at the intersection               // **********
    focus.append("circle")                                 // **********
        .attr("class", "y1")                                // **********
        .style("fill", "none")                             // **********
        .style("stroke", "#8A9781")                           // **********
        .attr("r", 4);                                     // **********
    
    // append the rectangle to capture mouse               // **********
    svg.append("rect")                                     // **********
        .attr("width", width)                              // **********
        .attr("height", height)                            // **********
        .style("fill", "none")                             // **********
        .style("pointer-events", "all")                    // **********
        .on("mouseover", function() { 
          focus.style("display", null); 
        
        tooltip
          .style("display", "block")

        })
        .on("mouseout", function() { 
        
        tooltip
          .style("display", "none")
          focus.style("display", "none"); })
        .on("mousemove", mousemove);         

    function mousemove() {         
        var x0 = x.invert(d3.mouse(this)[0]),              // **********
            i = bisectDate(data, x0, 1),                   // **********
            d0 = data[i - 1],                              // **********
            d1 = data[i],                                  // **********
            d = x0 - parseTime(d0[dimension.name]["value"]) > parseTime(d1[dimension.name]["value"]) - x0 ? d1 : d0;     // **********

        const bodyFluff = '<p class="value-headers">Month: <span class="value-headers-body">' + d0[dimension.name]["value"] + '</span></p>' +
                    '<p class="value-headers">Requests | Quote-to-DAT: <span class="value-headers-body">' + Math.round(d[measures[0].name]["value"]*100) + '%</span></p>' + 
                    '<p class="value-headers">Won | Quote-to-DAT: <span class="value-headers-body">' + Math.round(d[measures[1].name]["value"]*100) + '%</span></p>' + 
                    '<p class="value-headers">Difference: <span class="value-headers-body">' + Math.round((d[measures[0].name]["value"] - d[measures[1].name]["value"])*100) + '%</span></p>'

        tooltip.html(bodyFluff)
        if (x(parseTime(d[dimension.name]["value"])) < width - 180) {
          tooltip
          .style("left", (d3.mouse(this)[0] + 80) + "px")
          .style("top", (d3.mouse(this)[1]-25) + "px")
        } else {
          tooltip
            .style("left", (d3.mouse(this)[0] - 150) + "px")
            .style("top", (d3.mouse(this)[1]-25) + "px")
        }
        
        focus.select("circle.y0")                           // **********
            .attr("transform",                             // **********
                  "translate(" + x(parseTime(d[dimension.name]["value"])) + "," +         // **********
                                 y(d[measures[0].name]["value"]) + ")");   
        focus.select("circle.y1")                           // **********
            .attr("transform",                             // **********
                  "translate(" + x(parseTime(d[dimension.name]["value"])) + "," +         // **********
                                 y(d[measures[1].name]["value"]) + ")");        // **********
    }                                                      // **********


        const legend = svg.selectAll(".legend")
        .data(measures)
      .enter()
        .append("g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { 
            return "translate(" + ((i * 180) - width/1.2) + "," + (height + margin.bottom/2) + ")"; });
    
        legend.append("circle")
            .attr("cx", width - 24)
            .attr("cy", 9)
            .attr("r", 7)
            .style("fill", (d,i)=>{
              return colors[i]
            });

        legend.append("text")
            .attr("x", width - 12)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "beginning")
            .style("font-size",10)
            .text((d,i)=>{
                if (i == 0) {
                  return "Requests | Quote-to-DAT ratio"
                } else {
                  return "Shipments won | Quote-to-DAT ratio"
                }
              
              });

    done()
  }
});
