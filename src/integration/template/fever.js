export const object = {
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
    // console.log(config)
    console.log("ELEMENT", element)

    // first we set the dimensions and margins of the graphic
    const margin = {top: 40, right: 20, bottom: 66, left: 60};
    const width = element.clientWidth - margin.left - margin.right;
    const height = element.clientHeight - margin.top - margin.bottom;

    console.log("element", element)

    const svg = (
      d3.select(element).select('svg')
        .html('')
        .attr('width', '100%')
        .attr('height', '100%')
    )

    const group = svg.append('g')
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .attr("width", "100%")
        .attr("height", (height + "px"))
        .classed("group", true)


    // determine which parseTime to use by looking at the data columns
    var parseTimeDay = d3.timeParse("%Y-%m-%d");
    var parseTimeMonth = d3.timeParse("%Y-%m");

    var parseTime;

    const dimensions_ordered = queryResponse.fields.dimension_like
    const measures_ordered = queryResponse.fields.measure_like

    // determine if parseTime should be by day or by month
    if (parseTimeDay(data[1][dimensions_ordered[0].name].value)) {
      parseTime = parseTimeDay
    } else {
      parseTime = parseTimeMonth
    }

    data.forEach(function(d) {
      if (parseTime(d[dimensions_ordered[0].name].value) == null) {
        return 
      }
      d[dimensions_ordered[0].name].value = parseTime(d[dimensions_ordered[0].name].value)
    })

    data.sort(function(a,b) {
      return b.date - a.date
    })

    console.log("DATA", data)


    // divide the data into 3 separate groups
    const colors = ["#27566b", "#007b82", "#8cbb61"]

    let data1 = []
    let data2 = []
    let data3 = []

    measures_ordered.forEach(function(j, index) {
      data.forEach(function(d) {

        const data_pod = {};

        data_pod["date"] = d[dimensions_ordered[0].name].value;
        data_pod["value"] = d[measures_ordered[index].name].value;

        if (index == 0) {
          data1.push(data_pod)
        } else if (index == 1) {
          data2.push(data_pod)
        } else {
          data3.push(data_pod)
        }
      })
    })


    console.log("data1, data2, data3", data1, data2, data3)
    
    // parseTime becomes a function using the d3.timeParse() function, it's to make the dates
    // in our csv file readable to our machine

    var x = d3.scaleTime()
      .domain(d3.extent(data, function(d) { return d[dimensions_ordered[0].name].value; }))
      .range([0, width]);

    const minVal = Math.min(
      Math.min(...data1.map(d => d.value)), 
      Math.min(...data2.map(d => d.value)),
      Math.min(...data3.map(d => d.value))
      )

    const maxVal = Math.max(
      Math.max(...data1.map(d => d.value)), 
      Math.max(...data2.map(d => d.value)),
      Math.max(...data3.map(d => d.value))
      )
    
    var y = d3.scaleLinear()
      .domain([minVal, maxVal])
      .range([height, 0]);

    // -----------------------------
    // NEW DATE LOGIC - DIDN'T USE CLIPPATHS 
    const today = new Date()

    let dateCutoff;

    data3.reverse().forEach(function(j, index) {
        if (j.date < today) {
            dateCutoff = j.date
        } else {
            return
        }
    })

    // console.log("dateCutoff", dateCutoff)

    data3 = data3.filter(d => d.date < dateCutoff) // actuals
    data2 = data2.filter(d => d.date >= d3.max(data3, d => d.date)) // forecast

    console.log("cutoff data2, data3", data2, data3)


    // ------------------------------



    var line = d3.line()
          .defined(function(d) { return d.value != null && d.value != 0 && x(d.date) >= 0})
          .curve(d3.curveNatural)
          .x(function(d) {
            return x(d.date);})
          .y(function(d) {
              return y(d.value);
            })

    var movingLine = d3.line()
          .defined(function(d) { return d.value != null && x(d.date) >= 0})
          .curve(d3.curveNatural)
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

    // console.log("successfully created moving avg line")

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

      // console.log("drew lines")

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

      // console.log("drew legend")

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

      // -----------------------------------------------------------------------------
      // TOOLTIPS

      // tooltip div outside of svg to house the information and form the tooltip text box
      const tooltip = d3.select(element)
        .append("div")
        .attr("id", "tooltip-custom-viz")
        .style("position", "absolute")
        .style("padding", "5px")
        .style("background-color", "#ffffff")
        .style("border", "solid")
        .style("border-color", "lightgrey")
        .style("border-width", ".5px")
        .attr("class", "tooltip")
  
      // group element to house all the tooltip things in svg
      const tt = group.append("g")
        .classed("tooltip", true)

      const tooltipLine = tt.append("line")
  
      const tooltipCircles = tt.append("g")

      // box that covers entire plot area and is see-through
      const tooltipBox = tt.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("opacity", 0)
        .on("mousemove", drawTooltip)
        .on("mouseout", removeTooltip)

      // calculate dates
      const startAndEndWeek = (date) => {
        const dt = new Date(date)
        const monday = new Date(dt)
        monday.setDate(monday.getDate() - monday.getDay() + 1)
        const nextMonday = new Date(dt)
        nextMonday.setDate(nextMonday.getDate() - nextMonday.getDay() + 8)
        return [monday, nextMonday]
      }

      function removeTooltip() {
        if (tooltip) tooltip.style("display", "none");
        if (tooltipLine) tooltipLine.attr("stroke", "none");
        tooltipCircles.selectAll("circle").remove();
      }

      function drawTooltip() {

        // data wrangling - determine the date of the mouse
        const ttdate = x.invert(d3.mouse(tooltipBox.node())[0])
        const ttdayofwk = d3.timeFormat("%u")(ttdate)

        const [mon, nextMon] = startAndEndWeek(ttdate)

        // calculate the closest monday date to the mouse date since data is weekly
        const closestMonday = function(ttdayofwk) {
          if (["5","6"].includes(ttdayofwk)) {
            const wkdt = nextMon;
            return wkdt
          } else {
            const wkdt = mon;
            return wkdt
          }
        } 

        // set wkdt to not have a time so can filter the data on that date correctly
        const wkdt = closestMonday(ttdayofwk).setHours(0,0,0,0)

        // reformat data so that can easily filter on it for the tooltip data
        const tooltipData = [{"name":"target", "info": data1}, {"name":"forecast", "info":data2}, {"name":"actual", "info":data3}]

        const ttdata = []

        tooltipData.forEach(d => {
          const filtered = d.info.filter(i => {
            return i.date.getTime() == wkdt
          })

          if (filtered.length > 0) {
            ttdata.push({"name":d.name, "info":filtered})
          }
        })

        ttdata.sort((a,b) => {
          return b.info[0].value - a.info[0].value // does do something
        })

        // add elements/shapes
        tooltipLine.attr("stroke", "#a6a6a6")
          .attr("x1", x(wkdt))
          .attr("x2", x(wkdt))
          .attr("y1", 0)
          .attr("y2", height)
          .attr("stroke-dasharray", "3, 3")

        console.log('TTDATA', ttdata)
        console.log("x", x(wkdt), wkdt)
        console.log(width, height)

        tooltipCircles.selectAll("circle").remove();
        tooltipCircles.selectAll("circle")
          .data(ttdata)
          .enter()
          .append("circle")
          .attr("r", 3)
          .attr("cx", d => x(d.info[0].date))
          .attr("cy", d => y(d.info[0].value))
          .style('fill', '#3a4245')

        // have title case for the labels in the tooltip text
        function titleCase(str) {
          let sentence = str.toLowerCase().split(" ");
          for (let i = 0; i < sentence.length; i++) {
            sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1)
          }
          return sentence.join(" ")
        }

        tooltip.html(d3.timeFormat("%b %-d, %Y")(wkdt) + "<hr>")
          .style("display", "block")
          .style("font-size", 12)
          // .style("left", d3.event.pageX + 15 + "px")
          .style("top", d3.event.pageY - 10 + "px")
          .selectAll()
          .data(ttdata)
          .enter()
          .append("div")
          .style("color", "#323232")
          .style("font-size", 12)
          .html(d => titleCase(d.name) + ':&nbsp' + '<span style="float:right;">' + d3.format(",.0f")(d.info[0].value) + '</span>')

        // if mouse is past 85% of x width, move the tooltip text box to the left of the line
        if (d3.event.pageX > width*.85) {
          tooltip
            .style("left", d3.event.pageX - 110 + "px")
        } else {
          tooltip
            .style("left", d3.event.pageX + 15 + "px")
        }
      }

      // -----------------------------------------------------------------------------

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
}