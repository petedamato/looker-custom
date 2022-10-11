export const object = {
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
  updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {

    // TODO Hover over each rule to see rule subcategories/descriptions
    // TODO Differentiate between ASP and SPOT CONTROL DNB rules
    // TODO Decide on whether to use subrules or supra rules for filters
    // TODO Remove TMS demo

    if (environment == "prod") {
      if (!handleErrors(this, queryResponse, {
        min_pivots: 0, max_pivots: 0,
        min_dimensions: 0, max_dimensions: undefined,
        min_measures: 0, max_measures: 3
      })) return
    }

    const convertNull = function(input) {
      if (input == null) {
        return 0
      } else {
        return input
      }
    }

    const convertNullString = function(input) {
      if (input == null) {
        return "N/A"
      } else {
        return input
      }
    }

    const checkForRule = function(input, valObj) {
      let test = false
      valObj.forEach((ent,i)=>{
        if (input == ent.rule) {
          test = i
          return
        }
      })
      return test
    }

    const palette = ["#27566b","#8cbb61","#007b82","#f1cc56","#339f7b","grey"]
    const parseTimeDay = d3.timeParse("%Y-%m-%d");
    const parseTimeDayTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
    const parseTime = d3.timeParse("%H:%M");
   
    d3.select("#vis").html('');

        // set the dimensions and margins of the graph
    const margin = {top: 30, right: 180, bottom: 30, left: 10},
        width = 510 - margin.left - margin.right,
        height = 340 - margin.top - margin.bottom,
        height_chart = 120;

    const dimensions = queryResponse.fields.dimension_like;
    const measures = queryResponse.fields.measure_like;

    const pivots = queryResponse.fields.pivots;

    // Add an svg element for each group. The will be one beside each other and will go on the next row when no more room available

    let data_remix = []
    let shipper_mix = []

    data.forEach((entry)=>{
      console.log(entry)
      if (shipper_mix.includes(entry["shipper_applications.name"]["value"])) {
        data_remix.forEach((inter,i)=>{
          if (inter["shipper"] == entry["price_requests.shipper_application_id"]["value"]) {
            let checked = false
            inter["rules"].forEach((new_entry) => {
              if (new_entry["rule"] == entry["price_requests_spot_control_panel.id"]["value"]) {
                checked = true
                new_entry["reason"] += ("|" + convertNullString(entry["price_requests_spot_rate_event.not_bid_reason"]["value"]))
                new_entry["values"].forEach((entry_value)=>{
                  entry_value.requests += convertNull(entry["price_requests.price_requests_count"][entry_value.date]["value"])
                  entry_value.quotes += convertNull(entry["price_requests.quoted_shipment_count"][entry_value.date]["value"])
                  entry_value.unquoted += (convertNull(entry["price_requests.price_requests_count"][entry_value.date]["value"]) - convertNull(entry["price_requests.quoted_shipment_count"][entry_value.date]["value"]))
                })
              }
            })
            if (checked == false) {
              let rule = {}
              rule["rule"] = entry["price_requests_spot_control_panel.id"]["value"]
              rule["strategy"] = entry["price_requests_spot_rate_event.strategy_chosen_name"]["value"] 
              rule["reason"] = convertNullString(entry["price_requests_spot_rate_event.not_bid_reason"]["value"])
              rule["values"] = []

              const vals = Object.keys(entry["price_requests.price_requests_count"])
              vals.forEach((ent) =>{
                let rulePod = {}
                rulePod["date"] = ent
                rulePod["requests"] = convertNull(entry["price_requests.price_requests_count"][ent]["value"])
                rulePod["quotes"] = convertNull(entry["price_requests.quoted_shipment_count"][ent]["value"])
                rulePod["unquoted"] = convertNull(entry["price_requests.price_requests_count"][ent]["value"]) - convertNull(entry["price_requests.quoted_shipment_count"][ent]["value"])
                rule["values"].push(rulePod)
              })

              inter["rules"].push(rule)
            }
          }
        })
      } else {
        shipper_mix.push(entry["shipper_applications.name"]["value"])
        let pod = {}
        pod["shipper"] = entry["price_requests.shipper_application_id"]["value"]
        pod["shipper_name"] = entry["shipper_applications.name"]["value"]
        pod["rules"] = []
        let rule = {}
        rule["rule"] = entry["price_requests_spot_control_panel.id"]["value"]
        rule["strategy"] = entry["price_requests_spot_rate_event.strategy_chosen_name"]["value"] 
        rule["reason"] = convertNullString(entry["price_requests_spot_rate_event.not_bid_reason"]["value"])
        rule["values"] = []

        const vals = Object.keys(entry["price_requests.price_requests_count"])
        vals.forEach((ent) =>{
          let rulePod = {}
          rulePod["date"] = ent
          rulePod["requests"] = convertNull(entry["price_requests.price_requests_count"][ent]["value"])
          rulePod["quotes"] = convertNull(entry["price_requests.quoted_shipment_count"][ent]["value"])
          rulePod["unquoted"] = convertNull(entry["price_requests.price_requests_count"][ent]["value"]) - convertNull(entry["price_requests.quoted_shipment_count"][ent]["value"])
          rule["values"].push(rulePod)
        })

        pod["rules"].push(rule)

        data_remix.push(pod)
      }
    })
    
    const datesStorage = Object.keys(data[0]["price_requests.price_requests_count"])


    data_remix.forEach((entry)=>{
      let data_container = []

      datesStorage.forEach((outer,i)=>{
        let pod = {}
        pod["total"] = 0
        pod["week"] = outer
        entry.rules.forEach((inner)=>{
          pod[String(inner.rule)] = inner.values[i].unquoted
          pod["total"] += inner.values[i].unquoted
        })
        data_container.push(pod)
      })
      entry["chart_values"] = data_container
    })


    // data.forEach((entry)=>{
    //   if (shipper_mix.includes(entry["shipper_applications.name"]["value"])) {
    //     data_remix.forEach((inter)=>{
    //       if (inter["shipper_name"] == entry["shipper_applications.name"]["value"]) {

    //         let rule = {}
    //         rule["rule"] = entry["price_requests_spot_control_panel.id"]["value"]
    //         rule["strategy"] = entry["price_requests_spot_rate_event.strategy_chosen_name"]["value"] 
    //         rule["reason"] = entry["price_requests_spot_rate_event.not_bid_reason"]["value"]
    //         rule["values"] = []

    //         const vals = Object.keys(entry["price_requests.price_requests_count"])
    //         vals.forEach((ent) =>{
    //           let rulePod = {}
    //           rulePod["date"] = ent
    //           rulePod["requests"] = convertNull(entry["price_requests.price_requests_count"][ent]["value"])
    //           rulePod["quotes"] = convertNull(entry["price_requests.quoted_shipment_count"][ent]["value"])
    //           rulePod["unquoted"] = convertNull(entry["price_requests.price_requests_count"][ent]["value"]) - convertNull(entry["price_requests.quoted_shipment_count"][ent]["value"])
    //           rule["values"].push(rulePod)
    //         })

    //         inter["rules"].push(rule)
    //       }
    //     })

    //   } else {
    //     shipper_mix.push(entry["shipper_applications.name"]["value"])
    //     let pod = {}
    //     pod["shipper"] = entry["price_requests.shipper_application_id"]["value"]
    //     pod["shipper_name"] = entry["shipper_applications.name"]["value"]
    //     pod["rules"] = []
    //     let rule = {}
    //     rule["rule"] = entry["price_requests_spot_control_panel.id"]["value"]
    //     rule["strategy"] = entry["price_requests_spot_rate_event.strategy_chosen_name"]["value"] 
    //     rule["reason"] = entry["price_requests_spot_rate_event.not_bid_reason"]["value"]
    //     rule["values"] = []

    //     const vals = Object.keys(entry["price_requests.price_requests_count"])
    //     vals.forEach((ent) =>{
    //       let rulePod = {}
    //       rulePod["date"] = ent
    //       rulePod["requests"] = convertNull(entry["price_requests.price_requests_count"][ent]["value"])
    //       rulePod["quotes"] = convertNull(entry["price_requests.quoted_shipment_count"][ent]["value"])
    //       rulePod["unquoted"] = convertNull(entry["price_requests.price_requests_count"][ent]["value"]) - convertNull(entry["price_requests.quoted_shipment_count"][ent]["value"])
    //       rule["values"].push(rulePod)
    //     })

    //     pod["rules"].push(rule)

    //     data_remix.push(pod)

    //   }
    // })

    data_remix.sort((a,b)=>{
      return (d3.max(b["chart_values"], (d)=>{
        return d.total
      }) - d3.max(a["chart_values"], (d)=>{
        return d.total
      }))
    })

    const maxTotal = function() {
      let maxy = 0
      datesStorage.forEach((ent,i)=>{
        let dateMax = 0
        data_remix.forEach((entry)=> {
          dateMax += entry.chart_values[i]["total"]
        })

        if (dateMax > maxy) {
          maxy = dateMax
        }
      })
      return maxy
    }

    const maxTotalNum = maxTotal()
        // group the data: I want to draw one line per group

    let globalStack = [] 

    datesStorage.forEach((ench,i)=>{
      let datPod = {}
      datPod["week"] = ench
      data_remix.forEach((entry)=> {
          datPod[entry.shipper_name] = entry.chart_values[i]["total"]
        })
      globalStack.push(datPod)
    })

    const this_keys = Object.keys(globalStack[0]).filter((ent)=>{
      return ent != "week"
    })
    
    const shipperNest = d3.nest() // nest function allows to group the calculation per level of a factor
      .key(function(d) { 
        return d.shipper_name})
      .entries(data_remix);
    
    //END DATA MANIPULATION PHASE

    let localScale = d3.local();
    let localPath = d3.local();
    let localAxis = d3.local();

    const svg = d3.select("#vis")
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("class", (d,i)=>{
            return "g" + "-" + i
          })
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")")


      // Add titles
      svg
        .append("text")
        .attr("text-anchor", "start")
        .attr("y", -5)
        .attr("x", 0)
        .attr("font-size", 10)
        .text(function(d){ 
          return "Total Unquoted"
        });

      // Add X axis
      const x = d3.scaleTime()
        .domain(d3.extent(datesStorage, function(d) { 
          return parseTimeDay(d); }))
        .range([ 0, width ]);

      const xAxis = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(2))


        // Add Y axis
      let y = d3.scaleLinear()
        .domain([0,10000])
        .range([ height, 0 ]);

      // Area generator
      const area = d3.area()
      .x(function(d) { 
        return x(parseTimeDay(d.data.week)); })
      .curve(d3.curveMonotoneX)
      .y0(function(d) { 
        return y(d[0]); })
      .y1(function(d) { return y(d[1]); })

      const stackedData = d3.stack()
        .keys(this_keys)(globalStack)

      // Add titles
      const labels = svg
        .selectAll(".drop")
        .data(this_keys)
        .enter().append("g")
        .attr("class", (d,i)=>{
          return "drop " + "g-" + i
        })
        .attr("transform", "translate(" + (width + 20) + "," + 0 + ")")

      labels
          .append("rect")
          .attr("x", 0)
          .attr("y", function(d,i){ return (i * 14) - 10})
          .attr("opacity", .5)
          .attr("height", 12)
          .attr("width", 200)
          .style("fill", function(d,i) { 
            return palette[i%6]
          })

      labels
          .append("text")
          .attr("font-size", 10)
          .attr("x", 0)
          .attr("y", function(d,i){ return i * 14})
          .attr("pointer-events", "none")
          .text(d => d)

        $(".drop").on("mouseover", function(evt) {
            const grabber = $(this).attr("class").replace("drop ","")
            $(this).attr("opacity", .8)
            $("path").attr("opacity", .1)
            $(".area." + grabber).attr("opacity", 1)
        }).on("mouseout", function(evt) {
            $("rect").attr("opacity", .5)
            $("path").attr("opacity", 1)
        })

        // Show the areas
      svg
        .selectAll(".area")
        .data(stackedData)
        .enter()
        .append("path")
          .attr("class", (d,i)=> {
            return "area " + "g-" + i})
          .style("fill", function(d,i) { 
            return palette[i%6]
          })
          .attr("d", area)

    done()
  }
}