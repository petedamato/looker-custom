import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'
import * as $ from 'jquery'

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
                stroke: rgb(230, 230, 230);
                shape-rendering: crispEdges;
                stroke-opacity: .1;
            }
        .cleveland-text-large {
          font-size: 72px;
        }
        .cleveland-text-large {
          font-size: 18px;
        }
        .gridline {
          opacity:.1;
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
        min_dimensions: 0, max_dimensions: undefined,
        min_measures: 0, max_measures: 3
      })) return
    }

    let colors = ["#27566b","#8cbb61","#007b82"]
    d3.select("#vis")
            .select("svg").html("")

    // TK
    if (config.color_reverse == "reversed") {
      colors = colors.reverse();

    } else {
      colors = colors;

    }

    const margin = {
      top: 10,
      bottom: 10,
      left: 30,
      right: 30
    };

    // const width = element.clientWidth - margin.left - margin.right
    // const height = element.clientHeight - margin.top - margin.bottom

    // const dimension = queryResponse.fields.dimension_like[0]

    let measuresIntermediate = queryResponse.fields.measure_like

    let measures = []

    measuresIntermediate.forEach((ent) =>{
      measures.unshift(ent)
    })

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

  const x = d3.scaleLinear()
        .domain([0,
              d3.max([
                  d3.max(data, function(entry){
                    return entry[measures[0].name]["value"]
                  }), 
                  d3.max(data, function(entry){
                    return entry[measures[1].name]["value"]
                  }),
                  d3.max(data, function(entry){
                    return entry[measures[2].name]["value"]
                  })
                ])
              ])
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(measures.map((ent)=>{
          return ent.name 
        }))
        .range([height,0])
        .padding(0.05);

    const pointsA = [{
        x: x.range()[0], y: y.bandwidth() + y(measures[2].name)
      },{
        x: x.range()[1], y: y.bandwidth() + y(measures[2].name)
      },{
        x: x.range()[1] - ((width - x(data[0][measures[1].name]["value"]))/2), y: y(measures[1].name) + 1
      },{
        x: x.range()[0] + ((width - x(data[0][measures[1].name]["value"]))/2), y: y(measures[1].name) + 1
      }];

    // const pointsA = [{
    //     x: x.range()[0], y: 100
    //   },{
    //     x: x.range()[1], y: 100
    //   },{
    //     x: 375, y: 150
    //   },{
    //     x: 125, y: 150
    //   }];

    const pointsB = [{
        x: x.range()[0] + ((width - x(data[0][measures[1].name]["value"]))/2), y: (y.bandwidth() + y(measures[2].name)) * 2
      },{
        x: x.range()[1] - ((width - x(data[0][measures[1].name]["value"]))/2), y: (y.bandwidth() + y(measures[2].name)) * 2
      },{
        x: x.range()[1] - ((width - x(data[0][measures[1].name]["value"])*0.1)/2), y: y(measures[0].name)
      },{
        x: x.range()[0] + ((width - x(data[0][measures[1].name]["value"])*0.1)/2), y: y(measures[0].name)
      }];
    
    const line = d3.line()
      .x(function(d) {
        return d.x;
      })
      .y(function(d) {
        return d.y;
      });

    svg.append('path')
      .attr("d", line(pointsA) + 'Z')
      .style("fill", "black")
      .style("stroke", "black")
      .attr("opacity", .1);

   svg.append('path')
      .attr("d", line(pointsB) + 'Z')
      .style("fill", "black")
      .style("stroke", "black")
      .attr("opacity", .1);
    // append the rectangles for the bar chart
    svg.selectAll(".bar-thresh")
        .data(measures)
      .enter().append("rect")
        .attr("class", "bar-thresh")
        .attr("x", function(d) { 
          return (width - x(data[0][d.name]["value"])*.1)/2 
        })
        .attr("width", (d,i)=>{
          if (i == 1) {
            return x(data[0][d.name]["value"]* .1)
          } else {
            return 0
          }
        })
        .attr("y", function(d) { 
          return y("price_requests.won_shipment_count"); })
        .attr("height", function(d) { return y.bandwidth(); })
        .attr("fill", "black")
          .attr("opacity", .1); 
    // append the rectangles for the bar chart
    svg.selectAll(".bar")
        .data(measures)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { 
          return (width - x(data[0][d.name]["value"]))/2 
        })
        .attr("width", (d)=>{
          return x(data[0][d.name]["value"])
        })
        .attr("y", function(d) { 
          return y(d.name); })
        .attr("height", function(d) { return y.bandwidth(); })
        .attr("fill", (d,i)=>{
          return colors[i]
        });

    const threshVals = [measures[0],measures[1],measures[1]]



    svg.selectAll(".bar-thresh-label-rects")
        .data(threshVals)
      .enter().append("rect")
        .attr("class", "bar-thresh-label-rects")
        .attr("x", (d,i)=>{
            return width - [150,100][i] - 20
        })
        .attr("y", function(d,i) { 
          return (y("price_requests.won_shipment_count") + y.bandwidth()/2) - 35 + (i * 30); })
        .attr("width", (d,i)=>{
            return [150,100][i]
        })
        .attr("height", 26)
        .attr("opacity", (d,i)=>{
          if (i == 0) {
            return 1
          } else if (i == 1) {
            return .1
          } else {
            return 0
          }
        })
        .attr("fill", (d,i)=>{
          return ["#27566b","black"][i]
        })

    svg.selectAll(".bar-thresh-label")
        .data(threshVals)
      .enter().append("text")
        .attr("class", "bar-thresh-label")
        .attr("x", function(d,i) { 
            return width - 26
        })
        .attr("y", function(d,i) { 
          if (i != 2) {
            return (y("price_requests.won_shipment_count") + y.bandwidth()/2) - 18 + (i * 30)
          } else {
        
        return (y("price_requests.won_shipment_count") + y.bandwidth()/2) - 26 + (i * 30); 
        
        }})
          
        .attr("fill", (d,i)=>{
          if (i == 0) {
            return "white"
          } else { 
            return "black"
          }
        })
        .attr("text-anchor",(d,i)=>{
            return "end"
        })
        .text((d,i)=>{
          if (i == 0) {
            return ["Shipments Won", "Target*"][i] + ": " + d3.format(',')(data[0][d.name]["value"])
          } else if (i == 1) {
            return ["Shipments Won", "Target"][i] + ": " + d3.format(',')(Math.round(data[0][d.name]["value"]/10))
          } else {
            return "Assumes 10% Win Rate Target"
          }
          
        })
        .attr("font-size", (d,i)=>{
          if (i == 2) {
            return 10
          }
        })


    svg.selectAll(".bar-label")
        .data(measures)
      .enter().append("text")
        .attr("class", "bar-label")
        .attr("x", function(d,i) { 
          if (i == 0) {
            return (width/2) + 12
          } else {
            return (width/2)
          }
        })
        .attr("y", function(d) { 
          return (y(d.name) + y.bandwidth()/2) + 6; })
        .attr("fill", (d,i)=>{
          if (i == 0) {
            return "black"
          } else {
            return "white"
          }
        })
        .attr("text-anchor",(d,i)=>{
          if (i == 0) {
            return "beginning"
          } else {
            return "middle"
          }
        })
        .text((d,i)=>{
          return ["Shipments Won", "Shipments Quoted", "Shipments Available"][i] + ": " + d3.format(',')(data[0][d.name]["value"])
        })
        .attr("opacity", (d,i)=>{
          if (i == 0) {
            return 0
          }
        });

    // // add the x Axis
    // svg.append("g")
    //     .attr("transform", "translate(0," + height + ")")
    //     .call(d3.axisBottom(x));

    // // add the y Axis
    // svg.append("g")
    //     .call(d3.axisLeft(y));


    done()
  }
})