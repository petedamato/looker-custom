import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker.

    id: "bullet-chart",
    label: "ZDev Bullet Chart",
    options: {
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
            </style>
            <svg>
            </svg>`;
        element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`
    },

    // Render in response to the data or settings changing
    updateAsync: function(data, element, config, queryResponse, details, done) {
        if (!handleErrors(this, queryResponse, {
            min_pivots: 0, max_pivots: 0,
            min_dimensions: 0, max_dimensions: 0,
            min_measures: 1, max_measures: 20
        })) return
try {

    console.log(data, queryResponse)

      // data.forEach(function(d) {
      //       d.percToPlan = +d.actual / +d.plan 
      //   })

    // const dimension = queryResponse.fields.dimension_like[0]
    const measures = queryResponse.fields.measure_like

    let final_data = []

    measures.forEach(function(entry){
        let data_pod = {}
        data_pod["value"] = data[0][entry.name].value
        data_pod["label"] = entry.name
        final_data.push(data_pod)
    })

    final_data = [final_data]

    // const pivots = queryResponse.fields.pivots

    // const legend_label = pivots[1].field_group_variant

    let dimensions = {
        margin: {
            top: 15,
            right: 130,
            bottom: 15,
            left: 40
        }
    }

    const bulletPadding = 4

    const w = element.clientWidth;
    const h = element.clientHeight;

    dimensions.boundedWidth = w - dimensions.margin.left - dimensions.margin.right;
    dimensions.boundedHeight = Math.min(h - dimensions.margin.top - dimensions.margin.bottom,120)

    const svg = (
      d3.select(element).select('svg')
        .html('')
        .attr('width', '100%')
        .attr('height', '100%')
    )

    const group = svg.append('g')
        .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
        .attr("width", "100%")
        .attr("height", ((dimensions.boundedHeight) + "px"))
            .classed("group", true)

    // build scales
    const xMetrics = ["metric"]

    const xScale = d3.scaleLinear()
                 .domain([0, d3.max(final_data,function(d,i) {
                    return Math.max(+d[0].value,+d[1].value)
                    })])
                 .range([0, dimensions.boundedWidth])

    const yScale = d3.scaleBand()
        .domain(xMetrics.map(d => d))
        .range([0, dimensions.boundedHeight])
        .padding(0.45)

    // draw data
    const stackedData = d3.stack()
        .keys(['actual_spot_1','actual_contract_1'])
        .value((obj, key)=>{
            let return_val;
            obj.forEach(function(d,i){
                if (d.label == key) {
                    return_val = d.value
                }
            })
            return return_val
        })(final_data)

    const rects = group.append("g")

    const outerRects = rects
        .selectAll(".outer")
        .data(final_data)
        .enter()
            .append("rect")
            .attr("x", (d,i) => xScale(0))
            .attr("y", d => yScale(xMetrics[0]))
            .attr("width", (d,i) => {
                return xScale(d[0].value)
            })
            .attr("height", yScale.bandwidth())
            .attr("fill", "#fbfbfb")
            .style("stroke", "#323232")
            .attr("class", "outer")
            // .style("opacity", 0.3)

    const innerRects = rects
        .selectAll(".stacked")
        .data(stackedData)
        .enter()
        .append("g")
            .attr("class", "stacked")
            .selectAll("rect .stacked")
            .data(function(d) {return d;})
            .enter()
            .append("rect")
                .attr("class", "stacked")
                .attr("x", d => xScale(d[0]))
                .attr("y", d => {
                    return yScale("metric") + bulletPadding
                })
                .attr("width", (d,i) => {
                    return xScale(d[1]-d[0])
                })
                .attr("height", yScale.bandwidth() - bulletPadding*2)
                .attr("stroke", "#5a5a5a")
                .attr("stroke-width", 1)
                .attr("fill", function(d,i){
                    if (+d.data[3].value < +d.data[2].value) {
                        if (d[0] == 0) {
                            return "#D76106"
                        } else {
                            return "rgba(215, 97, 6,0.75)"
                        }
                    } else {
                        if (d[0] == 0) {
                            return "#0072b5"
                        } else {
                            return "rgba(0, 115, 181,0.75)"
                        }
                    }
                })

    const stackedLabels = rects
        .selectAll(".stacked-label")
        .data(stackedData)
        .enter()
        .append("g")
            .attr("class", "stacked-label")
            .selectAll("text .stacked")
            .data(function(d) {return d})
            .enter()
            .append("text")
                .attr("x", d => xScale(d[1]) - 9)
                .attr("y", d => yScale("metric") + 8)
                .text(d => {
                    if (+d[1] == +d.data[5].value) {
                        return "S"
                    } else {
                        return "C"
                    }
                })
                .attr("text-anchor", "right")
                .style("dominant-baseline", "hanging")
                .attr("fill", "white")
                .attr("font-size", "0.6em")
                .attr("font-weight", "600")
                .attr("font-family", "sans-serif")

    const innerBarText = rects
        .selectAll(".inner-text")
        .data(final_data)
        .enter()
        .append("text")
            .attr("x", (d,i) => xScale(0) + 2)
            .attr("y", d => yScale("metric") + yScale.bandwidth()/2)
            .text((d) => 
                { 
                    if (config.currency_type == "dollar") {
                        return d3.format("$,.0f")(parseInt(d[3].value))
                    } else {
                        return d3.format(",.0f")(parseInt(d[3].value))
                    }
                    
                })
            .attr("text-anchor", "left")
            .style("dominant-baseline", "middle")
            .attr("fill", "#ffffff")
            .attr("font-size", "0.7em")
            .attr("font-weight", "500")
            .attr("font-family", "sans-serif")
            .attr("class", "inner-text")

// Update from here
   function getQuarter(d) {
      d = d || new Date();
      var m = Math.floor(d.getMonth()/3) + 1;
      return m > 4? m - 4 : m;
    }


    const yearTarget = rects
        .selectAll(".plan")
        .data(final_data)
        .enter()
            .append("g")
            .attr("class", "plan")
            .attr("transform", function(d, i) { return "translate(" + xScale(+d[0].value) + "," + 26 + ")"; })

    yearTarget
        .append("path")
        .attr("d", d3.symbol().size(30).type(d3.symbolTriangle))
          .attr("transform", "rotate(180)")
          .attr("pointer-events", "none")
          .style("fill", "black")

    const yearTargetText = yearTarget.append("text")
            .attr("x", 0)
            .attr("y", -8)
            .text("Budget Target")
            .attr("text-anchor", "middle")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#323232")
            .attr("font-size", "0.6em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "inner-text")

    const quarterlyTarget = rects
        .selectAll(".pace")
        .data(final_data)
        .enter()
            .append("g")
            .attr("class", "pace")
            .attr("transform", function(d, i) { return "translate(" + (xScale(+d[2].value)) + "," + 26 + ")"; })

    quarterlyTarget
        .append("path")
        .attr("d", d3.symbol().size(30).type(d3.symbolTriangle))
        .attr("transform", "rotate(180)")
          .attr("pointer-events", "none")
          .style("fill", "#007b82")

    const quarterlyTargetText = quarterlyTarget.append("text")
            .attr("x", -4)
            .attr("y", -8)
            .text(()=>{
                const res = "Q" + getQuarter(new Date()) + " target";
                return res;
            })
            .attr("text-anchor", "beginning")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#007b82")
            .attr("font-size", "0.6em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "pace-text")

    // Dummy data
    const monthlyTarget = rects
        .selectAll(".mpace")
        .data(final_data)
        .enter()
            .append("g")
            .attr("class", "mpace")
            .attr("transform", function(d, i) { return "translate(" + (xScale(+d[2].value * .8)) + "," + 26 + ")"; })

    monthlyTarget
        .append("path")
        .attr("d", d3.symbol().size(30).type(d3.symbolTriangle))
        .attr("transform", "rotate(180)")
          .attr("pointer-events", "none")
          .style("fill", "#523130")

    const monthlyTargetText = monthlyTarget.append("text")
            .attr("x", 4)
            .attr("y", -8)
            .text(()=>{
                const res = d3.timeFormat("%b")(new Date()) + " target";
                return res;
            })
            .attr("text-anchor", "end")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#523130")
            .attr("font-size", "0.6em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "mpace-text")

    const yearForecast = rects
        .selectAll(".forecast")
        .data(final_data)
        .enter()
            .append("g")
            .attr("class", "forecast")
            .attr("transform", function(d, i) { return "translate(" + xScale(+d[1].value) + "," + (yScale.bandwidth() + 48) + ")"; })

    yearForecast
        .append("path")
        .attr("d", d3.symbol().size(30).type(d3.symbolTriangle))
          .attr("pointer-events", "none")
          .style("fill", "#989898")

    const yearForecastText = yearForecast.append("text")
            .attr("x", 0)
            .attr("y", 10)
            .text("Forecast")
            .attr("text-anchor", "middle")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#989898")
            .attr("font-size", "0.6em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "forecast-text")

    // Dummy data
    const quarterlyForecast = rects
        .selectAll(".qforecast")
        .data(final_data)
        .enter()
            .append("g")
            .attr("class", "qforecast")
            .attr("transform", function(d, i) { return "translate(" + (xScale(+d[1].value * .5)) + "," + (yScale.bandwidth() + 48) + ")"; })

    quarterlyForecast
        .append("path")
        .attr("d", d3.symbol().size(30).type(d3.symbolTriangle))
          .attr("pointer-events", "none")
          .style("fill", "#6ea6aa")

    const quarterlyForecastText = quarterlyForecast.append("text")
            .attr("x", -4)
            .attr("y", 10)
            .text(()=>{
                const res = "Q" + getQuarter(new Date()) + " forecast";
                return res;
            })
            .attr("text-anchor", "beginning")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#6ea6aa")
            .attr("font-size", "0.6em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "qforecast-text")

    const monthlyForecast = rects
        .selectAll(".mforecast")
        .data(final_data)
        .enter()
            .append("g")
            .attr("class", "mforecast")
            .attr("transform", function(d, i) { return "translate(" + (xScale(+d[1].value * .4)) + "," + (yScale.bandwidth() + 48) + ")"; })

    monthlyForecast
        .append("path")
        .attr("d", d3.symbol().size(30).type(d3.symbolTriangle))
          .attr("pointer-events", "none")
          .style("fill", "#856b69")

    const monthlyForecastText = monthlyForecast.append("text")
            .attr("x", 4)
            .attr("y", 10)
            .text(()=>{
                const res = d3.timeFormat("%b")(new Date()) + " forecast";
                return res;
            })
            .attr("text-anchor", "end")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#856b69")
            .attr("font-size", "0.6em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "mforecast-text")

    
    //


    // Okay from here

    const rightLabels = group.append("g")

    const percPlanLabels = rightLabels
        .selectAll(".perc-label")
        .data(final_data)
        .enter()
            .append("text")
            .attr("x", (d,i) => xScale(d[0].value) + 30)
            .attr("y", d => yScale("metric") + yScale.bandwidth()/2 - 3)
            .text(d => d3.format(".0%")(+d[3].value/+d[0].value))
            .attr("text-anchor", "middle")
            .style("dominant-baseline", "middle")
            .attr("fill", function(d,i) {
                if (+d[3].value < +d[0].value) {
                    return "#D76106"
                } else { return "#0072b5"
                } 
            })
            .attr("font-size", "1.8em")
            .attr("font-weight", "500")
            .attr("font-family", "sans-serif")
            .attr("class", "perc-label")
        .append("tspan")
            .attr("x", (d,i) => xScale(d[0].value) + 30)
            .attr("y", d => yScale("metric") + yScale.bandwidth()/2 + 16)
            .text("of target")
            .style("text-transform", "uppercase")
            .attr("text-anchor", "middle")
            .style("dominant-baseline", "middle")
            .attr("fill", function(d,i) {
                if (+d[3].value < +d[0].value) {
                    return "#D76106"
                } else {
                    return "#0072b5"
                }
            })
            .attr("font-size", "0.35em")
            .attr("font-weight", "500")
            .attr("font-family", "sans-serif")

    const planLabels = rightLabels
        .selectAll(".plan-label")
        .data(final_data)
        .enter()
        .append("text")
            .attr("x", (d,i) => xScale(+d[0].value) + 90)
            .attr("y", d => yScale("metric") + yScale.bandwidth()/2 - 2)
            .text((d) => 
                { 
                    if (config.currency_type == "dollar") {
                        return d3.format("$,.0f")(parseInt(d[3].value))
                    } else {
                        return d3.format(",.0f")(parseInt(d[3].value))
                    }
                    
                })
            .attr("text-anchor", "middle")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#323232")
            .attr("font-size", "1em")
            .attr("font-weight", "500")
            .attr("font-family", "sans-serif")
            .attr("class", "plan-label")
        .append("tspan")
            .attr("x", (d,i) => xScale(+d[0].value) + 90)
            .attr("y", d => yScale("metric") + yScale.bandwidth()/2 + 12)
            .text("Target")
            .attr("text-anchor", "middle")
            .style("dominant-baseline", "middle")
            .attr("fill", "#323232")
            .attr("font-size", "0.7em")
            .attr("font-weight", "500")
            .attr("font-family", "sans-serif")

        } catch(error) {
            console.log(error)
        }


        // Callback at the end of the rendering to let Looker know it's finished
        done()
    }
});