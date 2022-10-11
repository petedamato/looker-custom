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
    
    // TODO 
    // TK
    // Allow user to sort by rule ID or by size of shipments

    const palette = ["#27566b","#8cbb61","#007b82","#f1cc56","#339f7b"]
    const parseTimeDay = d3.timeParse("%Y-%m-%d");
    const parseTimeDayTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
    const parseTime = d3.timeParse("%H:%M");
    const formatDate = d3.timeFormat("%b %d")
   
    d3.select("#vis").html('');

        // set the dimensions and margins of the graph
    const margin = {top: 30, right: 30, bottom: 180, left: 50},
        width = 240 - margin.left - margin.right,
        height = 320 - margin.top - margin.bottom,
        height_chart = 120;

    const dimensions = queryResponse.fields.dimension_like;
    const measures = queryResponse.fields.measure_like;

    const pivots = queryResponse.fields.pivots;

    // Add an svg element for each group. The will be one beside each other and will go on the next row when no more room available

    let data_remix = []
    let shipper_mix = []
    let rules_order = []
    const vals = Object.keys(data[0]["price_requests.price_requests_count"])
    data.forEach((entry,i)=>{
      // Check to see if shipper_mix, our logging array, has the shipper in it yet =>
      if (shipper_mix.includes(entry["shipper_applications.name"]["value"])) {
        data_remix.forEach((inter)=>{
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
                  new_entry["total"] += entry_value.unquoted
                    if (entry_value.unquoted > new_entry["max"]) {
                      new_entry["max"] = entry_value.unquoted
                    }
                })
              }
            })
            if (checked == false) {
              let rule = {}
              rule["max"] = 0
              rule["total"] = 0
              rule["rule"] = entry["price_requests_spot_control_panel.id"]["value"]
              rule["strategy"] = entry["price_requests_spot_rate_event.strategy_chosen_name"]["value"] 
              rule["reason"] = convertNullString(entry["price_requests_spot_rate_event.not_bid_reason"]["value"])
              rule["values"] = []

              
              vals.forEach((ent) =>{
                let rulePod = {}
                rulePod["date"] = ent
                rulePod["requests"] = convertNull(entry["price_requests.price_requests_count"][ent]["value"])
                rulePod["quotes"] = convertNull(entry["price_requests.quoted_shipment_count"][ent]["value"])
                rulePod["unquoted"] = convertNull(entry["price_requests.price_requests_count"][ent]["value"]) - convertNull(entry["price_requests.quoted_shipment_count"][ent]["value"])
                rule["total"] += rulePod["unquoted"]
                if (rulePod["unquoted"] > rule["max"]) {
                  rule["max"] = rulePod["unquoted"]
                }

                rule["values"].push(rulePod)

              })
              inter["rules"].push(rule)
            }
          }
        })
        // => If not, add shipper to the tracking array
      } else {
        shipper_mix.push(entry["shipper_applications.name"]["value"])
        let pod = {}
        pod["shipper"] = entry["price_requests.shipper_application_id"]["value"]
        pod["shipper_name"] = entry["shipper_applications.name"]["value"]
        pod["rules"] = []
        let rule = {}
        rule["max"] = 0
        rule["total"] = 0
        rule["rule"] = entry["price_requests_spot_control_panel.id"]["value"]
        rule["strategy"] = entry["price_requests_spot_rate_event.strategy_chosen_name"]["value"] 
        rule["reason"] = convertNullString(entry["price_requests_spot_rate_event.not_bid_reason"]["value"])
        rule["values"] = []

        vals.forEach((ent) =>{

          let rulePod = {}
          rulePod["date"] = ent
          rulePod["requests"] = convertNull(entry["price_requests.price_requests_count"][ent]["value"])
          rulePod["quotes"] = convertNull(entry["price_requests.quoted_shipment_count"][ent]["value"])
          rulePod["unquoted"] = convertNull(entry["price_requests.price_requests_count"][ent]["value"]) - convertNull(entry["price_requests.quoted_shipment_count"][ent]["value"])
          rule["total"] += rulePod["unquoted"]
          if (rulePod["unquoted"] > rule["max"]) {
            rule["max"] = rulePod["unquoted"]
          }

          rule["values"].push(rulePod)

        })

        pod["rules"].push(rule)
        data_remix.push(pod)
      }
    })

    data_remix.forEach((entry,i)=>{
      entry.rules.sort((a,b) => {
        return b["max"] - a["max"]
      })

      let data_container = []

      vals.forEach((outer,i)=>{
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
      return (b["rules"].length - a["rules"].length )
    })

        // group the data: I want to draw one line per group
    const shipperNest = d3.nest() // nest function allows to group the calculation per level of a factor
      .key(function(d) { 
        return d.shipper_name})
      .entries(data_remix);

    const finalData = shipperNest.filter((entry)=>{
      return entry["values"][0]["rules"][0]["max"] > 1
    })

    //END DATA MANIPULATION PHASE

    let localScale = d3.local();
    let localPath = d3.local();
    let localAxis = d3.local();

    const svg = d3.select("#vis")
        .selectAll("uniqueChart")
        .data(finalData)
        .enter()
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("class", (d,i)=>{
            return "group g" + "-" + i
          })
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")")
          // .attr("display", (d,i) => {
          //   if (d.values[0]["rules"][0]["max"] < 2) {
          //     return "none"
          //   }
          // })
          .each(function(d) {
            const yMax = d3.max(d.values[0].chart_values, function(num) {
              return num.total
            })

            const yScale = localScale.set(this, d3
              .scaleLinear()
              .domain([0, yMax])
              .range([height_chart,0]));

            localPath.set(this, d3
                .area()
                .curve(d3.curveMonotoneX)
                .x(function(d) { 
                  return x(parseTimeDay(d.data.week)); })
                .y0(d => yScale(d[0]))
                .y1(d => yScale(d[1])))
          });

      // Add titles
      svg
        .append("text")
        .attr("text-anchor", "start")
        .attr("y", -5)
        .attr("x", 0)
        .attr("font-size", 10)
        .text(function(d){ 
          return d.key
        });

      // Add X axis
      const x = d3.scaleTime()
        .domain(d3.extent([parseTimeDay(vals[0]), parseTimeDay(vals[vals.length - 1])]))
        .range([ 0, width ]);

      const xAxis = svg.append("g")
        .attr("class", "base-axis")
        .attr("visibility", "visible")
        .attr("transform", "translate(0," + height_chart + ")")
        .call(d3.axisBottom(x).ticks(2))

      const xAxis2 = svg.append("g")
        .attr("class", "scrollable-axis")
        .attr("visibility", "hidden")
        .attr("transform", "translate(0," + height_chart + ")")
        .call(d3.axisBottom(x).ticks(d3.timeMonday.every(1)).tickFormat((d,i)=>{
          return formatDate(d)
        }))

      var ticks = xAxis2.selectAll(".tick")

      ticks.attr("class", function(d,i) {
        return "tick tick-" + i });
        // Add Y axis
      let y = d3.scaleLinear()
        .domain([0,10000])
        .range([ height_chart, 0 ]);

            // Area generator
      const area = d3.area()
      .x(function(d) { 
        return x(parseTimeDay(d.data.week)); })
      .y0(function(d) { 
        return y(d[0]); })
      .y1(function(d) { return y(d[1]); })

      d3.select("#vis")
        .append("div")
        .attr("class", "tooltip")

      const tooltip = d3.select(".tooltip")
        .style("background-color", "#262d33")
        .style("border-radius", "2px")
        .style("padding", "5px")
        .style("position", "absolute")
        .style("pointer-events","none")
        .html("<div id='value-header'></div><div id='value-subheader'></div><div id='value-body'></div>")

      // Add titles
      const rulesList = svg
        .selectAll(".rules-list")
        .data(function(d){ 
          return [d.values[0].rules]})
        .enter().append("g").attr("transform", "translate(0," + (height_chart + 20) + ")")
        .append("foreignObject")
          .attr("class", "rules-list-container")

      const rules = rulesList.append('xhtml:ul').attr('class', 'rules-list');

      rules.each(function(eac) {
        const ruleListContainer = d3.select(this)
        // $(this).append("li").attr("class", "rules-list")
        const rulesData = d3.select(this).data()[0]
        rulesData.forEach((entry,i)=>{
          ruleListContainer.append("li")
              .attr("class", (d,i)=>{
                if (entry.max > 1) {
                  return "list-rule rect-" + entry.rule
                } else {
                  return "list-rule faded rect-" + entry.rule
                }
              })
              .html(()=>{
                  const strr = "<div class='rule-entry rect-" + entry.rule + "' style='background-color:" + palette[i%5] +"'>"
                  const reason = entry.reason.replace("Do not bid","DNB")
                  const labels = reason.split("|")

                  if (labels.length > 1) {
                    return strr + "Rule " + entry.rule + ": " + labels[0] + " + " + (labels.length - 1) + (labels.length > 2 ? ' rules' : ' rule') + "</div>"
                  } else 
                  {
                    return strr + "Rule " + entry.rule + ": " + labels[0] + "</div>"
                  }
              })
            .style("opacity", function() {
              if (entry.max > 1) {
                return .8
              } else {
                return .1
              }
             })
            .on("mouseover", function(d){
                d3.select(this).style("opacity", 1)
                $('#value-header').html(entry.rule + " | DO NOT BID")
                $('#value-subheader').html(entry.total + " total shipments")

                const ruleBatch = entry.reason.split("|")
                let rules = ''
                let counter = 0

                ruleBatch.forEach((entch) =>{
                  if (entry == "N/A") {
                    counter += 1;
                  } else {
                    rules += '<p>' + entch.replace("Do not bid on ","") + '</p>';
                  }
                }) 
                // Check to see how many rules with N/A flag
                if (counter == 1) {
                  rules += '<p> 1 rule without description</p>'
                } else if (counter > 1) {
                  rules += ('<p>' + counter + " rules without description" + '</p>')
                }
                
                $(".tooltip").addClass("visible")

                $('#value-body').html(rules)
                })
            .on("mousemove", function(){
                tooltip
                  .style("left", (this.getBoundingClientRect().x + window.scrollX) + "px")
                  .style("top", (this.getBoundingClientRect().y + window.scrollY - 40) + "px")
            })
            .on("mouseout", function(){
              d3.select(this).style("opacity", .8)
              if ($(this).attr("class").includes("faded")) {
                d3.select(this).style("opacity", .1)
              }
              $(".tooltip").removeClass("visible")
            })

          })
        })

        // Show the areas
      const mouseTracker = svg
        .append("rect")
        .attr("fill", "none")
        .attr("class","mouse-tracker")

      const paths = svg
        .append("g")
        .attr("class","path-level")
        .selectAll("mylayers")
        .data(function(d,i){ 
          const that_keys = d.values[0].rules.map((entry) =>{
            return String(entry.rule)
          })

          //stacking
          const stackedData = d3.stack()
            .keys(that_keys)
            (d.values[0].chart_values)

          return stackedData 
        })
        .enter()

        // For later

      const chunk = (width)/vals.length

      paths
        .append("path")
          .attr("class", function(d,i) { 
            return "myArea " + String(d.key) + " rect-" + String(d.key) })
          .style("fill", function(d,i) { 
            return palette[i%5]
          })
          .attr("d", function(d) {
              return localPath.get(this)(d)
          })
          .on("mouseover", ()=>{
            d3.select(d3.event.target.parentNode.parentNode).selectAll(".scrollable-axis").attr("visibility", "visible")
            d3.select(d3.event.target.parentNode.parentNode).selectAll(".base-axis").attr("visibility", "hidden")
              
            $(".textg").addClass("engaged")
          })
          .on("mousemove", (d,i)=>{

              d3.event.preventDefault();
              const mouse = d3.mouse(d3.event.target);
              const [
                xCoord,
                yCoord,
              ] = mouse;

              d3.select(d3.event.target.parentNode).selectAll(".hoverLine")
                .attr('opacity', 1)
                .attr('x1', xCoord)
                .attr('x2', xCoord)

              // d.key - path rule
              // d.index - sequential num


              $(event.target).parent().parent().children(".scrollable-axis").children()
                .attr("opacity", 1)

              $(event.target).parent().parent().children(".scrollable-axis").children().not(".tick-" + Math.floor(xCoord/ chunk))
                .attr("opacity", 0)

                $(".textg").children()
                .attr("opacity", 0)
              $(".rect-" + d.key).children().not(".label-" + Math.floor(xCoord/ chunk))
                .attr("opacity", 0)

              $(".rect-" + d.key + " > .label-" + Math.floor(xCoord/ chunk))
                .attr("opacity", 1)

              const mouseDate = x.invert(xCoord);
              // const mouseDateSnap = d3.timeDay.floor(mouseDate);
              
              // const bisectDate = d3.bisector(d => d.date).right;
              // const xIndex = bisectDate(data, mouseDate, 1);

          })
        .on("mouseout", (d)=>{
          $(".scrollable-axis").attr("visibility", "hidden")
          $(".base-axis").attr("visibility", "visible")
          $(".textg").removeClass("engaged")
          d3.selectAll('.hoverLine')
                .attr('opacity', 0)
        })

      const textLayer = paths
       .append("g")
        .attr("class", function(d,i) { 
            return "textg yscale-" + String(localScale.get(this).domain()[1]) + " " + String(d.key) + " rect-" + String(d.key) })
        .selectAll("text")
        .data((d)=>{
          d["total"] = 0
          d.forEach((entry)=>{
            d["total"] += (entry[1] - entry[0])
          })
          return d
        })
        .enter()

      textLayer
        .append("text")
          .attr("class", function(d,i){
            return "label-" + i
          })
          .attr("x", function(d,i) { 
              return x(parseTimeDay(d.data.week))
          })
          .attr("y", function(d,i) { 
            const yMaxThis = $(this).parent().attr("class").split("yscale-")[1].split(" ")[0]
            if (d) {
              const yScaleThis = d3.scaleLinear().range([height_chart,0]).domain([yMaxThis,0])

            return height_chart - yScaleThis(d[1])
           }
          })
          .attr("text-anchor", function(d,i) { 
            if (x(parseTimeDay(d.data.week)) > width - 30) {
              return "end"
            } else if (x(parseTimeDay(d.data.week)) > width - 70) {
              return "middle"
            } else {
              return "start"
            }
          })
          .attr("pointer-events", "none")
          .attr("font-size", 12)
          .text(function(d,i) {
            const yMaxThis = $(this).parent().attr("class").split("yscale-")[1].split(" ")[0]
            if (d) {
              const yScaleThis = d3.scaleLinear().range([height_chart,0]).domain([yMaxThis,0])
              return Math.round(yScaleThis.invert(d[1] - d[0]))
            }
          })

      const mouseLine = d3.selectAll('.path-level')
          .append('line').attr('class','hoverLine').attr("opacity", 0)
            .attr("pointer-events", "none")
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 0)
            .attr('y2', height_chart)
            .attr('stroke', '#147F90')
            .attr('fill', '#A6E8F2')

      shipperNest.forEach((ent,i) => {
        const yMax = d3.max(ent.values[0].chart_values, function(d,i) {
          return d.total
        })

        const grabber = ".g-" + i
        y.domain([0,yMax])
        d3.select(grabber).append("g").call(d3.axisLeft(y).ticks(5))


        $(grabber).children().children().children().children().children(".rule-entry").on("click", function(evt) {
            if ($(this).hasClass("clicked")) {
              $(this).removeClass("clicked")
              $(this).parent().parent().children().removeClass("unclicked")
              const textClass = ".textg." + $(this).attr("class").split("rect-")[1]
              $(textClass).removeClass("seen")
              $(".group" + grabber).removeClass("click-on")
              $(".group" + grabber).children(".path-level").children(".myArea").removeClass("selected")
              $(".group" + grabber).children(".path-level").children(".myArea").attr("opacity", 1)
            } else if ($(grabber).hasClass("click-on")) {
                $(".textg").removeClass("seen")
                const textClass = ".textg." + $(this).attr("class").split("rect-")[1]
                $(textClass).addClass("seen")
                $(".rule-entry").removeClass("clicked")
                const indie = "." + $(this).attr("class").split(" ")[1]

                
                $(this).addClass("clicked")
                $(this).parent().parent().children().addClass("unclicked")
                $(".group" + grabber).children(".path-level").children(".myArea").removeClass("selected")
                $(".group" + grabber).children(".path-level").children(".myArea").attr("opacity", .1)
                $(".group" + grabber).children(".path-level").children(indie).addClass("selected")
                // $(grabber).addClass("click-on")
              } else {
                const textClass = ".textg." + $(this).attr("class").split("rect-")[1]
                $(textClass).addClass("seen")
                $(".group" + grabber + " .drop rect").removeClass("clicked")
                $(this).addClass("clicked")
                $(this).parent().parent().children().addClass("unclicked")
                $(".group" + grabber).children(".path-level").children(".myArea").attr("opacity", .1)
                const indie = "." + $(this).attr("class").split(" ")[1]

                $(".group" + grabber).children(".path-level").children(indie).addClass("selected")
                $(".group" + grabber).addClass("click-on")
            }
        })

        $(grabber).children(".drop").children("rect").on("mouseover", function(evt) {
            if ($(".group" + grabber).hasClass("click-on")) {
              $(grabber).children(".path-level").children(".myArea").attr("opacity", .1)
            } else {
              $(grabber).children(".path-level").children(".myArea").attr("opacity", .6)
            }
            
            $(this).attr("opacity", .8)
            $(grabber).children(".path-level").children("." + $(this).attr("class").split(" ")[1]).attr("opacity", 1)
        }).on("mouseout", function(evt) {
            $("rect").attr("opacity", .5)
            if ($(".group" + grabber).hasClass("click-on")) {
              $(grabber).children(".path-level").children(".myArea").attr("opacity", .5)
            } else {
              $(grabber).children(".path-level").children(".myArea").attr("opacity", 1)
            }
        })

      })

    done()
  }
}