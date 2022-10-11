export const object = {
  // Id and Label are legacy properties that no longer have any function besides documenting
  // what the visualization used to have. The properties are now set via the manifest
  // form within the admin/visualizations page of Looker
  id: "test",
  label: "ZDev Diverging",
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
      </svg>`;
    element.style.fontFamily = `Roboto,"Open Sans", "Helvetica", sans-serif`

  },
  // Render in response to the data or settings changing
  updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod",data2, config2) {
    if (environment == "prod") {
      if (!handleErrors(this, queryResponse, {
        min_pivots: 0, max_pivots: 0,
        min_dimensions: 0, max_dimensions: undefined,
        min_measures: 0, max_measures: 3
      })) return
    }
      d3.select("#vis")
        .select("svg").html("")

      const margin = {top: 40, right: 40, bottom: 40, left:40};
      const getNode = d3.select("#vis");

      // Update this once we have a better idea how Looker integration will look
      const new_node_width = getNode.select(function() { return this.parentNode; })
      const new_node_height = getNode.select(function() { return this.parentNode; })
      const w = new_node_width.node().getBoundingClientRect().width;
      const h = new_node_height.node().getBoundingClientRect().height;

      const width = w - margin.left - margin.right;
      const height = h - margin.bottom - margin.top;

       const headersNegative = ["C", "F"]

        const headersPositive = ["A", "B"]
            
        let dataPositive = []
        let dataNegative = []
        const dimensions = queryResponse.fields.dimension_like;
        const measures = queryResponse.fields.measure_like;

        let negPos = "carrier_scorecard_agg.carrier_grade"
        try {   

            let positivesVolume = []
            let negativesVolume = []
            let positivesUnique = []
            let negativesUnique = []

            let data_ready = []
            let data_keys = []

            data.forEach((d) => {
              if (data_keys.includes(d[dimensions[1].name].value)) {
                return
              } else if (d[dimensions[1].name].value != null) {
                data_keys.push(d[dimensions[1].name].value)
              }
            })

            data_keys.forEach((entry,i)=>{
              let pod = {}
              pod["group"] = entry
              pod["A"] = 0
              pod["B"] = 0
              pod["total"] = 0
              data.forEach((ent)=>{
                if (ent[dimensions[1].name]["value"] == entry) {
                  if (ent[dimensions[2].name]["value"] == "A") {
                    pod["A"] += ent[measures[0].name]["value"]
                    pod["total"] += ent[measures[0].name]["value"]
                  } else if(ent[dimensions[2].name]["value"] == "B") {
                    pod["B"] += ent[measures[0].name]["value"]
                    pod["total"] += ent[measures[0].name]["value"]
                  }
                }
              })
              positivesVolume.push(pod)
            })

            data_keys.forEach((entry,i)=>{
              let pod = {}
              pod["group"] = entry
              pod["C"] = 0
              pod["D"] = 0
              pod["E"] = 0
              pod["F"] = 0
              pod["total"] = 0
              data.forEach((ent)=>{
                if (ent[dimensions[1].name]["value"] == entry) {
                  if (ent[dimensions[2].name]["value"] == "C") {
                    pod["C"] += ent[measures[0].name]["value"]
                    pod["total"] += ent[measures[0].name]["value"]
                  } else if(ent[dimensions[2].name]["value"] == "D") {
                    pod["D"] += ent[measures[0].name]["value"]
                    pod["total"] += ent[measures[0].name]["value"]
                  } else if (ent[dimensions[2].name]["value"] == "E") {
                    pod["E"] += ent[measures[0].name]["value"]
                    pod["total"] += ent[measures[0].name]["value"]
                  } else if(ent[dimensions[2].name]["value"] == "F") {
                    pod["F"] += ent[measures[0].name]["value"]
                    pod["total"] += ent[measures[0].name]["value"]
                  }
                }
              })
              negativesVolume.push(pod)
            })

            const stackedPositives = d3.stack()
               .keys(headersPositive)(positivesVolume)

            const stackedNegatives = d3.stack()
               .keys(headersNegative)(negativesVolume)

          const y = d3.scaleBand().domain(data_keys.map((d)=>{
            return d
          })).range([height, 0]).padding(0.05)

          const universalMax = d3.max([d3.max(positivesVolume,(d)=>{
            return d.total
          }),d3.max(negativesVolume,(d)=>{
            return d.total
          })])

          const x = d3.scaleLinear().domain([0,universalMax]).range([0, (width/2)])

          const z = d3.scaleOrdinal().domain(["A", "B", "C", "F"]).range(["#27566b","#339f7b","#007b82","#f1cc56"])

          // append the svg object to the body of the page
          var svg = d3.select("#vis")
          .select("svg")
            .attr("width", w)
            .attr("height", h)

            const groupPos = svg.append('g')
                .attr('transform', `translate(${(width/2) + margin.left}, ${margin.top})`)
                .attr('width', (width/2 + "px"))
                .attr('height', (height + "px"))
                .attr("class","group-pos")

            const groupNeg = svg.append('g')
                .attr('transform', `translate(${margin.left}, ${margin.top})`)
                .attr('width', (width/2 + "px"))
                .attr('height', (height + "px"))
                .attr("class","group-neg")

            const posGroups = groupPos  
                .selectAll(".bar-groups")
                // Enter in the stack data = loop key per key = group per group
                .data(stackedPositives)
                .enter().append("g")
                  .attr("class", "bar-groups")
                  .attr("fill", function(d,i) { 
                    return z(d.key)
                    })

            const negGroups = groupNeg  
                .selectAll(".bar-groups-neg")
                // Enter in the stack data = loop key per key = group per group
                .data(stackedNegatives)
                .enter().append("g")
                  .attr("class", "bar-groups-neg")
                  .attr("fill", function(d,i) { 
                    return z(d.key)
                    })

            posGroups
                  .selectAll("rect")
                  // enter a second time = loop subgroup per subgroup to add all rectangles
                  .data(function(d) { return d; })
                  .enter().append("rect")
                    .attr("x", function(d) { 
                      return x(d[0]); })
                    .attr("y", function(d) { 
                      return y(d.data.group); })
                    .attr("height", function(d) { return y.bandwidth(); })
                    .attr("width",function(d) { return x(d[1]) - x(d[0])})

            negGroups
                  .selectAll("rect")
                  // enter a second time = loop subgroup per subgroup to add all rectangles
                  .data(function(d) { return d; })
                  .enter().append("rect")
                    .attr("x", function(d) { 
                      return ((width/2) - margin.left - x(d[1])); })
                    .attr("y", function(d) { 
                      return y(d.data.group); })
                    .attr("height", function(d) { return y.bandwidth(); })
                    .attr("width",function(d) { return x(d[1]) - x(d[0])})

    done()
  
  } catch(error) {
            
        } 
}
}