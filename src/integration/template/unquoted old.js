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
    const parseTimeDay = d3.timeParse("%Y-%m-%d");
    const parseTimeDayTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
    const parseTime = d3.timeParse("%H:%M");

    let rulesData = []
    d3.select("#vis").html('')

    data.forEach((entry, i)=>{
            let rules = {}
            let ruleArray = [];

            if (entry["spot_bidding_date_criterias_spcp.date_range"]["value"] != null && entry["spot_bidding_date_criterias_spcp.date_range"]["value"] != "null") {
              let pod = {}
              pod["rule"] = "date"
              pod["name"] = "Date"
              pod["deleted"] = (entry["spot_bidding_rules_spcp.is_deleted"]["value"] == "Yes" ? true : false)
              pod["deactivated"] = (entry["spot_bidding_date_criterias_spcp.is_active"]["value"] == "Yes" ? false : true)
              pod["value"] = entry["spot_bidding_date_criterias_spcp.date_range"]["value"]
              ruleArray.push(pod)
            }
            if (entry["spot_bidding_rule_start_time_criterias_spcp.range_start"]["value"] != null) {
              let pod = {}
              pod["rule"] = "start_time"
              pod["name"] = "Start time"
              pod["deleted"] = (entry["spot_bidding_rules_spcp.is_deleted"]["value"] == "Yes" ? true : false)
              pod["deactivated"] = (entry["spot_bidding_date_criterias_spcp.is_active"]["value"] == "Yes" ? false : true)
              pod["value"] = entry["spot_bidding_rule_start_time_criterias_spcp.range_start"]["value"]
              ruleArray.push(pod)
            } 
            if (entry["spot_bidding_proximal_hour_criterias_spcp.hour_range"]["value"] != "0 - inf") {
              let pod = {}
              pod["rule"] = "lead_time"
              pod["name"] = "Lead time"
              pod["deleted"] = (entry["spot_bidding_rules_spcp.is_deleted"]["value"] == "Yes" ? true : false)
              pod["deactivated"] = (entry["spot_bidding_date_criterias_spcp.is_active"]["value"] == "Yes" ? false : true)
              pod["value"] = entry["spot_bidding_proximal_hour_criterias_spcp.hour_range"]["value"]
              ruleArray.push(pod)
            } 
            if (entry["spot_bidding_geographic_criterias_spcp.value"]["value"] != null) {
              let pod = {}
              pod["rule"] = "geography"
              pod["name"] = "Geography"
              pod["deleted"] = (entry["spot_bidding_rules_spcp.is_deleted"]["value"] == "Yes" ? true : false)
              pod["deactivated"] = (entry["spot_bidding_date_criterias_spcp.is_active"]["value"] == "Yes" ? false : true)
              pod["value"] = entry["spot_bidding_geographic_criterias_spcp.value"]["value"]
              ruleArray.push(pod)
            } 

            if (entry["spot_bidding_mileage_criterias_spcp.range"]["value"] != "0 - inf") {
              let pod = {}
              pod["rule"] = "mileage"
              pod["name"] = "Mileage"
              pod["deleted"] = (entry["spot_bidding_rules_spcp.is_deleted"]["value"] == "Yes" ? true : false)
              pod["deactivated"] = (entry["spot_bidding_date_criterias_spcp.is_active"]["value"] == "Yes" ? false : true)
              pod["value"] = entry["spot_bidding_mileage_criterias_spcp.range"]["value"]
              ruleArray.push(pod)
            } 
            rules["rules"] = ruleArray
            rules["shipper"] = entry["shipper_applications_spcp.name"]["value"]
            rules["description"] = entry["spot_bidding_rules_spcp.reason"]["value"]

            if (ruleArray.length > 0) {
              rulesData.push(rules)
            }
    })



        // set the dimensions and margins of the graph
    var margin = {top: 30, right: 0, bottom: 180, left: 50},
        width = 210 - margin.left - margin.right,
        height = 390 - margin.top - margin.bottom;

      // group the data: I want to draw one line per group
      var sumstat = d3.nest() // nest function allows to group the calculation per level of a factor
        .key(function(d) { 
          return d.shipper;})
        .entries(rulesData);

      sumstat.sort((a, b)=>{
        return b.values.length - a.values.length
      })

      var sumstat2 = d3.nest() // nest function allows to group the calculation per level of a factor
      .key(function(d) { 
        return d["shipper_applications.name"]["value"];})
      .entries(data2);

      sumstat.forEach((entry)=>{
        sumstat2.forEach((ent)=>{
          if (entry.key == ent.key) {
            entry["data"] = ent.values
          }
        })
      })

      sumstat.forEach((entry) =>{
        if (entry.data) {
          entry.data.forEach((ent) =>{
            if (ent["price_requests.dates_priced_to_pickup"]["value"] >= 0) {
              const pickupDateTime = parseTimeDayTime(ent["price_requests.pickup_appointment_end_time"]["value"])
              const pickupTime = ent["price_requests.pickup_appointment_end_time"]["value"].split(" ")[1].split(":")[0] + ":" + ent["price_requests.pickup_appointment_end_time"]["value"].split(" ")[1].split(":")[1]
              const pickupDate = parseTimeDay(ent["price_requests.pickup_appointment_end_time"]["value"].split(" ")[0])
              const city = ent["price_requests.pickup_city_state"]["value"].split(", ")[0]
              const state = ent["price_requests.pickup_city_state"]["value"].split(", ")[1]
              const mileage = ent["price_requests.dat_miles"]["value"]
              const leadTime = ent["price_requests_avg_time_available.first_seen_lead_time"]["value"]

              entry.values.forEach((rule,i) =>{
                let flagArray1 = []
                let flagArray2 = []
                ent["display"] = []
                rule.rules.forEach((ru,j)=>{
                  if (ru.rule == "date") {
                    if (parseTimeDay(ru.value.split(" - ")[0]) < pickupDate && parseTimeDay(ru.value.split(" - ")[1]) > pickupDate) {
                      if (j == 0) {
                        flagArray1.push(i)
                      } else {
                        flagArray2.push(i)
                      }
                    }
                  } else if (ru.rule == "lead_time") {
                    if (ru.value < leadTime) {
                      if (j == 0) {
                        flagArray1.push(i)
                      } else {
                        flagArray2.push(i)
                      }
                    }
                  } else if (ru.rule == "start_time") {
                    if (parseTime(ru.value) > parseTime(pickupTime)) {
                      if (j == 0) {
                        flagArray1.push(i)
                      } else {
                        flagArray2.push(i)
                      }
                    }
                  } else if (ru.rule == "geography") {
                    if (ru.value.length == 2) {
                      if (ru.value == state) {
                        if (j == 0) {
                          flagArray1.push(i)
                        } else {
                          flagArray2.push(i)
                        }
                      }
                    } else {
                      if (ru.value == city + ", " + state) {
                        if (j == 0) {
                          flagArray1.push(i)
                        } else {
                          flagArray2.push(i)
                        }
                      }
                    }
                  } else if (ru.rule == "mileage") {
                    if (ru.value.split(" - ")[0] < +mileage && ru.value.split(" - ")[1] > +mileage) {
                        if (j == 0) {
                          flagArray1.push(i)
                        } else {
                          flagArray2.push(i)
                        }
                      }
                  }
                })

                if (rule.rules.length > 1) {
                  ent["display"] = flagArray1.filter(value => flagArray2.includes(value));
                } else {
                  ent["display"] = flagArray1
                }
                if (ent["display"].length > 0) {
                  // console.log(rule, ent)
                }
                
              })
            }
          })
        }
      })
      // What is the list of groups?
      const allKeys = sumstat.map(function(d){return d.shipper})

      // Add an svg element for each group. The will be one beside each other and will go on the next row when no more room available
      const svg = d3.select("#vis")
        .selectAll("uniqueChart")
        .data(sumstat)
        .enter()
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

      // // Add X axis --> it is a date format
      // var x = d3.scaleLinear()
      //   .domain(d3.extent(data, function(d) { return d.year; }))
      //   .range([ 0, width ]);
      // svg
      //   .append("g")
      //   .attr("transform", "translate(0," + height + ")")
      //   .call(d3.axisBottom(x).ticks(3));

      // //Add Y axis
      // var y = d3.scaleLinear()
      //   .domain([0, d3.max(data, function(d) { return +d.n; })])
      //   .range([ height, 0 ]);
      // svg.append("g")
      //   .call(d3.axisLeft(y).ticks(5));

      // // color palette
      // var color = d3.scaleOrdinal()
      //   .domain(allKeys)
      //   .range()

      // // Draw the line
      // svg
      //   .append("path")
      //     .attr("fill", "none")
      //     .attr("stroke", function(d){ return color(d.key) })
      //     .attr("stroke-width", 1.9)
      //     .attr("d", function(d){
      //       return d3.line()
      //         .x(function(d) { return x(d.year); })
      //         .y(function(d) { return y(+d.n); })
      //         (d.values)
      //     })

      // Add titles
      svg
        .append("text")
        .attr("text-anchor", "start")
        .attr("y", -5)
        .attr("x", 0)
        .attr("font-size", 10)
        .text(function(d){ return d.key});

      // Add titles
      const labels = svg
        .selectAll("g")
        .data(function(d){ 
          return d.values})
        .enter().append("g")
        .attr("class", "drop")
        .attr("transform", "translate(0," + margin.bottom + ")")

      labels
          .append("rect")
          .attr("x", 0)
          .attr("y", function(d,i){ return (i * 14) - 10})
          .attr("opacity", .2)
          .attr("height", 12)
          .attr("width", 200)
          .attr("fill", (d)=>{
            let color = "green"
            d.rules.forEach((ent) =>{
              if (ent["deactivated"] == true) {
                color = "red"
              }
            })
            return color
          })

      labels
          .append("text")
          .attr("font-size", 10)
          .attr("x", 0)
          .attr("y", function(d,i){ return i * 14})
          .text(function(d,i){ 
            if (d.rules.length > 1) {
              return d.rules[0]["name"] + ": " + d.rules[0]["value"] + " + " + (d.rules.length - 1) + (d.rules.length > 2 ? ' rules' : ' rule')
            } else 
            {
              return d.rules[0]["name"] + ": " + d.rules[0]["value"]
            }
          }
            )

    done()
  }
}