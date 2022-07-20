import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker.

    id: "colored-bar-chart",
    label: "ZDev Colored Bar Chart",
    options: {
        number_type: {
          type: 'string',
          label: 'Number Type',
          display: "select",
          values: [
            {"Raw": "raw"},
            {"Percentage": "percentage"},
            {"USD": "USD"}
          ],
          default: "percentage",
          section: "Data Options"
        },
        color_drops_decreases: {
            type: 'string',
            label: 'Color Decreases/Negatives',
            display: 'radio',
            values: [
                {"Yes": "yes"},
                {"No": "no"}
            ],
            default: "yes",
            section: "Plot Options"
        },
        months_shown: {
            type: "number",
            label: "# Months to Show",
            display: "number",
            default: 7,
            section: "Data Options"
        },
        bar_labels: {
            type: "string",
            label: "Bars to Label",
            display: "radio",
            values: [
                {"All": "all"},
                {"Extremes": "extremes"}
            ],
            default: "extremes",
            section: "Plot Options"
        },
        yaxis_label: {
            type: "string",
            label: "Y-Axis Label",
            display: "text",
            default: "",
            section: "Axes"
        },
        xaxis_label: {
            type: "string",
            label: "X-Axis Label",
            display: "text",
            default: "",
            section: "Axes"
        }
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

    updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
        if (environment == "prod") {
            if (!handleErrors(this, queryResponse, {
                min_pivots: 0, max_pivots: 0,
                min_dimensions: 1, max_dimensions: 1,
                min_measures: 1, max_measures: 2
            })) return
        }

        try {

            // set dimensions
            const margin = {
                top: 20,
                right: 10,
                bottom: 80,
                left: 60
            }
            
            const width = element.clientWidth 
            const height = element.clientHeight 
            const boundedWidth = width - margin.left - margin.right
            const boundedHeight = height - margin.top - margin.bottom

            const svg = (
                d3.select(element).select("svg")
                    .html("")
                    .attr("width", "100%")
                    .attr("height", "100%")
            )

            console.log("here1")

            const group = svg.append("g")
                .attr("transform", `translate(${margin.left}, ${margin.top})`)
                .attr("width", "100%")
                .attr("height", (height + "px"))
                .classed("group", true)

            console.log("here2")
            
            // load the data
            const parseTime = d3.timeParse("%Y-%m")
            
            const dimension = queryResponse.fields.dimension_like[0]
            const measures = queryResponse.fields.measure_like
            
            // console.log(data)
            console.log("measures", measures)
            
            let measure = null
            measures.forEach((m,i) => {
                if (m.value_format && m.value_format.includes("%")) {
                    measure = measures[i]
                } else {
                    return
                }
            })
            
            const groupAccessor = d => parseTime(d.group)
            const valueAccessor = d => {
                if (d["value"]) {
                    // return +String(d["value"]).replace(/%/g, '')/100
                    return d["value"]
                } else {
                    return +0
                }
            }
            
            
            // DATE STUF
            const today = new Date()
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
            const backDate = firstDayOfMonth.setMonth(firstDayOfMonth.getMonth() - config.months_shown);

            console.log("data", data)
            console.log("backdate", backDate, new Date(backDate))
            
            let data_ready = []
            
            data.forEach((d) => {
            
                let entry = {}
                if (d[measure.name].value != 0 && parseTime(d[dimension.name].value) > new Date(backDate)) {
                    entry["group"] = d[dimension.name].value
                    entry["value"] = d[measure.name].value
                    data_ready.push(entry)
                }
            
            })
            
            data_ready = data_ready.sort(function(a,b) {
                return new Date(groupAccessor(a)) - new Date(groupAccessor(b))
            })
            
            // scales
            const xScale = d3.scaleBand()
                .domain(data_ready.map(d => groupAccessor(d)))
                .range([0, boundedWidth])
                .padding(0.2)
            
            const yScale = d3.scaleLinear()
                .domain([
                    Math.min(0, d3.min(data_ready, d => valueAccessor(d))),
                    d3.max(data_ready, d => valueAccessor(d))
                ])
                .range([boundedHeight, 0])
            
            // draw data
            const bars = group.selectAll("rect")
                .data(data_ready)
                .enter()
                .append("rect")
                    .attr("x", d => xScale(groupAccessor(d)))
                    .attr("y", d => {
                        if (valueAccessor(d) < 0) {
                            return yScale(0)
                        } else {
                            return yScale(valueAccessor(d))
                        }
                    })
                    .attr("width", xScale.bandwidth())
                    .attr("height", d => {
                        if (valueAccessor(d) >= 0) {
                            return yScale(0) - yScale(valueAccessor(d))
                        } else {
                            return yScale(valueAccessor(d)) - yScale(0)
                        }
                    })
            
            if (config.color_drops_decreases == "no") {
                bars
                    .attr("fill", "#0072B5")
            } else {
                bars
                    .attr("fill", (d,i) => {
                        if (config.number_type == "percentage") {
                            if (valueAccessor(d) < 0) {
                                return "#D76106"
                            } else {
                                return "#0072B5"
                            }
                        } else {
                            if (i == 0) {
                                return "#0072b5"
                            } else {
                                const priorVal = valueAccessor(data_ready[i-1])
                                const currVal = valueAccessor(d)
            
                                if (currVal < priorVal) {
                                    return "#D76106"
                                } else {
                                    return "#0072B5"
                                }
                            }
                        }
                    })
                }
            
                const xAxisGenerator = d3.axisBottom()
                    .scale(xScale)
                    .tickSize(0)
                    .tickPadding([10])
                    .tickFormat(d3.timeFormat("%b"))    
            
                const xAxis = group.append("g")
                    .call(xAxisGenerator)
                        .style("transform", `translateY(${boundedHeight + 22}px)`)
                        .attr("stroke-opacity", 0.0)
                        .attr("font-size", "1em")
                        .attr("font-family", "sans-serif")
            
                const yAxisGenerator = d3.axisLeft()
                    .scale(yScale)
                    .tickSize(0)
                    .ticks(8)
                    .tickFormat((d)=>{
                        if (config.number_type == "percentage") {
                            return (d*100) + "%"
                        } else if (config.number_type == "USD") {
                            if (d.value>=1000000) {
                                return d3.format("$,")(d/1000000) + "M"
                            } else {
                                return d3.format("$,")(d)
                            }
                        } else {
                            return d3.format(",")(d)
                        }
            
                    })   
            
                const yAxis = group.append("g")
                    .call(yAxisGenerator)
                        .style("transform", `translate(10,0)`)
                        .attr("stroke-opacity", 0.0)
                        .attr("font-size", "1em")
                        .attr("font-family", "sans-serif")

                if (config.xaxis_label != "") {
                    const xAxisLabel = group.append("text")
                        .attr("x", (boundedWidth)/2)
                        .attr("y", (boundedHeight + 75))
                        .attr("fill", "black")
                        .style("font-size", "1.4em")
                        .text((d) => {
                            return config.xaxis_label
                        })
                        .style("text-anchor", "middle")
                }
                
                if (config.yaxis_label != "") {
                    const yAxisLabel = group.append("text")
                        .attr("x", -boundedHeight/2)
                        .attr("y", -margin.left + 20)
                        .attr("fill", "black")
                        .style("font-size", "1.4em")
                        .text((d) => {
                            return config.yaxis_label
                        })
                        .style("text-anchor", "middle")
                        .attr("transform", "rotate(-90)")
                
                }
            
            const minVal = d3.min(data_ready, d => valueAccessor(d))
            const maxVal = d3.max(data_ready, d => valueAccessor(d))
            
            const labelVals = [minVal, maxVal]
            
            const barText = group.append("g")
                .selectAll("text")
                .data(data_ready)
                .enter()
                .append("text")
                    .attr("x", d => xScale(groupAccessor(d)) + xScale.bandwidth()/2)
                    .attr("y", d => {
                        if (valueAccessor(d) >= 0) {
                            return yScale(valueAccessor(d)) - 6
                        } else {
                            return yScale(valueAccessor(d)) + 14
                        }
                    })
                    .text((d) => {
                        if (config.bar_labels == "all" && config.number_type == "percentage") {
            
                            return Math.round(d.value * 100, 1) + "%"
            
                        } else if (config.bar_labels == "extremes" && config.number_type == "percentage") {
            
                            if (labelVals.includes(d.value)) {
                                return Math.round(d.value * 100, 1) + "%"
                            }                 
            
                        } else if (config.bar_labels == "all" && config.number_type == "raw") {
            
                        return d3.format(",")(d.value)
            
                        } else if (config.bar_labels == "extremes" && config.number_type == "raw") {
            
                            if (labelVals.includes(d.value)) {
                                return d3.format(",")(d.value)
                            } 
            
                        } else if (config.bar_labels == "all" && config.number_type == "USD") {
                            
                            if (d.value>=1000000) {
                                return d3.format("$,")(d.value/1000000) + "M"
                            } else {
                                return d3.format("$,")(d.value)
                            }
                            
                        } else if (config.bar_labels == "extremes" && config.number_type == "USD") {
            
                            if (labelVals.includes(d.value)) {
                                if (d.value>=1000000) {
                                    return d3.format("$,")(d.value/1000000) + "M"
                                } else {
                                    return d3.format("$,")(d.value)
                                }
                            } 
                        }
                    })
                    .style("text-anchor", "middle")
                    .attr("fill", "#323232")
                    .attr("font-size", "0.75em")
                    .attr("font-family", "sans-serif")
    } catch(error) {
        if (environment == "prod") {
            console.log("somehow got in here")
            if (queryResponse.fields.dimensions.length != 1 || 
                queryResponse.fields.measures.length < 1) {
                    this.addError({title: "Dimension/Pivot Error", message: "This chart takes 1 dimension and 1 measure."});
                    return;
                }
        }
    }

    // callback at the end of the rendering to let Looker know it's finished
    done()

}
})