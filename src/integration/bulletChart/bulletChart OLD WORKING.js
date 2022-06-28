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
            top: 40,
            right: 200,
            bottom: 40,
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

    const xScales = final_data.map(function(d,i) {
        return d3.scaleLinear()
                 .domain([0, Math.max(+d[0].value,+d[1].value)])
                 .range([0, dimensions.boundedWidth])
    })

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
            .attr("x", (d,i) => xScales[i](0))
            .attr("y", d => yScale(xMetrics[0]))
            .attr("width", (d,i) => {
                return xScales[i](d[0].value)
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
                .attr("x", d => xScales[xMetrics.indexOf("metric")](d[0]))
                .attr("y", d => {
                    return yScale("metric") + bulletPadding
                })
                .attr("width", (d,i) => {
                    return xScales[0](d[1]-d[0])
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
                .attr("x", d => xScales[xMetrics.indexOf("metric")](d[1]) - 9)
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

    const planLines = rects
        .selectAll(".plan")
        .data(final_data)
        .enter()
            .append("line")
            .attr("x1", (d,i) => xScales[i](+d[0].value))
            .attr("x2", (d,i) => xScales[i](+d[0].value))
            .attr("y1", d => (yScale("metric") - 10))
            .attr("y2", d => (yScale("metric")) + yScale.bandwidth() + 10)
            .style("stroke", "#323232")
            .style("stroke-width", 15)
            .attr("class", "plan")

    const forecastRects = rects
        .selectAll(".forecast")
        .data(final_data)
        .enter()
        .append("rect")
            .attr("x", (d,i) => xScales[i](+d[1].value))
            .attr("y", d => yScale("metric") - 9)
            .attr("width", 5)
            .attr("height", yScale.bandwidth() + 18)
            .attr("fill", "#c1c1c1")
            .attr("stroke", "#323232")
            .attr("stroke-width", 1)
            .attr("class", "forecast")

    const pacePlanLines = rects
        .selectAll(".pace")
        .data(final_data)
        .enter()
        .append("line")
            .attr("x1", (d,i) => xScales[i](+d[2].value))
            .attr("x2", (d,i) => xScales[i](+d[2].value))
            .attr("y1", d => yScale("metric") - 10)
            .attr("y2", d => yScale("metric") + yScale.bandwidth() + 10)
            .attr("stroke", "#323232")
            .style("stroke-dasharray", "5,5")
            .attr("stroke-width", 3)
            .attr("class", "pace")

    const innerBarText = rects
        .selectAll(".inner-text")
        .data(final_data)
        .enter()
        .append("text")
            .attr("x", (d,i) => xScales[i](0) + 2)
            .attr("y", d => yScale("metric") + yScale.bandwidth()/2)
            .text(d => d3.format("$,.0f")(parseInt(d[3].value)))
            .attr("text-anchor", "left")
            .style("dominant-baseline", "middle")
            .attr("fill", "#ffffff")
            .attr("font-size", "0.7em")
            .attr("font-weight", "500")
            .attr("font-family", "sans-serif")
            .attr("class", "inner-text")
        

    // draw peripherals
    const tickLabels = ["Volume", "Revenue", "Margin"]

    const yAxisGenerator = d3.axisLeft()
        .scale(yScale)
        .tickSize(0)
        .tickPadding([10])
        .tickFormat((d,i) => tickLabels[i])
    
    const yAxis = group.append("g")
        .call(yAxisGenerator)
            .attr("stroke-opacity", 0.0)
            .attr("font-size", "1.1em")
            .attr("font-family", "sans-serif")
            .attr("font-weight", "600")
            .attr("class", "axis")
let firstPacePlanX,firstForecastX, firstPlanX;

    final_data.forEach(function(d,i) {
        firstPacePlanX = xScales[0](+d[2].value)
        firstForecastX = xScales[0](+d[1].value)
        firstPlanX = xScales[0](+d[0].value)
    })
    
    const topLabels = [firstPacePlanX, firstForecastX, firstPlanX]
    const topLabelPaddings = [20, 20, 20]
    const topLabelText = ["YTD Target", "Forecast", "Target"]
    const topLabelAlignment = ["middle", "end", "start"]
    const altLabelAlignment = ["middle", "start", "end"]

    console.log(topLabels)

//FIXES HERE

    for (const i in topLabels) {
        group.append("text")
            .attr("x", topLabels[i])
            .attr("y", d => yScale("metric") - topLabelPaddings[i])
            .text(topLabelText[i])
            .attr("text-anchor", ()=>{
                if (firstForecastX < firstPlanX) {
                    return topLabelAlignment[i]
                } else {
                    return altLabelAlignment[i]
                }
            })
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", function() {
                if (topLabelText[i] === "Forecast") {
                    return "#989898"
                } else {
                    return "#323232"
                }
            })
            .attr("font-size", "0.6em")
            .attr("font-weight", "700")
            .attr("font-family", "sans-serif")
            .attr("class", "inner-text")
    }

    const rightLabels = group.append("g")

    const percPlanLabels = rightLabels
        .selectAll(".perc-label")
        .data(final_data)
        .enter()
            .append("text")
            .attr("x", (d,i) => xScales[i](d[0].value) + 60)
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
            .attr("x", (d,i) => xScales[i](d[0].value) + 60)
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
            .attr("x", (d,i) => xScales[i](+d[0].value) + 135)
            .attr("y", d => yScale("metric") + yScale.bandwidth()/2 - 2)
            .text(d => d3.format("$,.0f")(+d[0].value))
            .attr("text-anchor", "middle")
            .style("text-transform", "uppercase")
            .style("dominant-baseline", "middle")
            .attr("fill", "#323232")
            .attr("font-size", "0.8em")
            .attr("font-weight", "500")
            .attr("font-family", "sans-serif")
            .attr("class", "plan-label")
        .append("tspan")
            .attr("x", (d,i) => xScales[i](+d[0].value) + 135)
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