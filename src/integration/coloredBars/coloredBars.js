import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker.

    id: "column-change",
    label: "ZDev Column Change",
    options: {
        currency_type: {
          type: 'string',
          label: 'Currency Prefix',
          display: "radio",
          values: [
            {"USD": "dollar"},
            {"None": "none"}
          ],
          default: "none"
        },
        bar_display: {
          type: 'string',
          label: 'Color drops/increases',
          display: "radio",
          values: [
            {"Yes": "yes"},
            {"No": "no"}
          ],
          default: "no"
        },
        labels: {
          type: 'string',
          label: 'X and Y labels',
          display: "radio",
          values: [
            {"Y label": "y-label"},
            {"X label": "x-label"},
            {"Both labels": "both-label"},
            {"No labels": "no-label"}
          ],
          default: "both-label"
        },
        color: {
          type: 'string',
          label: 'Color',
          display: "radio",
          values: [
            {"#27566b": "#27566b"},
            {"#007b82": "#007b82"},
            {"#339f7b": "#339f7b"},
            {"#0072B5": "#0072B5"}
          ],
          default: "#0072B5"
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
    // Render in response to the data or settings changing
    updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
        if (environment == "prod") {
            if (!handleErrors(this, queryResponse, {
                min_pivots: 0, max_pivots: 0,
                min_dimensions: 0, max_dimensions: 5,
                min_measures: 0, max_measures: 5
            })) return
        }
    
    try {
        var numberFormat = "count"

        const dimensionCreation = function() {
            const margin = {
                top: 50,
                right: 10,
                bottom: 45,
                left: 10
            }

        const width = element.clientWidth - margin.left - margin.right;
        const height = element.clientHeight - margin.top - margin.bottom;

        const svg = (
          d3.select(element).select('svg')
            .html('')
            .attr('width', '100%')
            .attr('height', '100%')
        )

        const group = svg.append('g')
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .attr("width", "100%")
            .attr("height", ((height - margin.top - margin.bottom) + "px"))
                .classed("group", true)


            return [margin, width, height, svg, group]
        }

        const dimension = queryResponse.fields.dimension_like[0]
        const measure = queryResponse.fields.measure_like[0]

        const parseDate = d3.timeParse("%Y-%m-%d")

        const groupAccessor = d => parseDate(d.group)
        const valueAccessor = d => +String(d["value"]).replace(/,/g, '') 
        // sometimes numbers come in as numbers, and sometimes come in as strings

        let data_ready = []

        data.forEach((d) => {
            let entry = {}
            if (d[measure.name].value != 0) {
                entry["group"] = d[dimension.name].value
                entry["value"] = d[measure.name].value
                data_ready.push(entry)
            }

        })

        console.log(data_ready)

        // data_ready = data_ready.sort(function(a,b) {
        //     return new Date(b.group) - new Date(a.group)
        // })

        data_ready = data_ready.sort(function(a,b) {
            return new Date(groupAccessor(a)) - new Date(groupAccessor(b))
        })

        const [margin, width, height, svg, group] = dimensionCreation()

        // scales
        const xScale = d3.scaleBand()
        .domain(data_ready.map(d => groupAccessor(d)))
        .range([0, width])
        .padding(0.2)

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data_ready, d => valueAccessor(d))])
            .range([height, 0])

        // draw data
        const bars = group.selectAll("rect")
            .data(data_ready)
            .enter()
            .append("rect")
                .attr("x", d => xScale(groupAccessor(d)))
                .attr("y", d => yScale(valueAccessor(d)))
                .attr("width", xScale.bandwidth())
                .attr("height", d => height - yScale(valueAccessor(d)))

        if (config.bar_display == "no") {
            bars
                    .attr("fill",  config.color)
        } else {
            bars
                    .attr("fill", (d,i) => {
                        if (i==0) {
                            return "lightgrey"
                        } else {
                            const priorVal = valueAccessor(data_ready[i-1])
                            const currVal = valueAccessor(d)

                            if (currVal >= priorVal) {
                                // return "#5BACD7"
                                return "#0072b5"
                            } else {
                                return "#D76106"
                            }
                        }
                    })
            }

        // draw peripherals
        // const xAxisGenerator = d3.axisTop()
        //     .scale(xScale)
        //     .tickSize(0)
        //     .tickPadding([35])
        //     .tickFormat(d3.timeFormat("%b %-d"))

        const xAxisGenerator = d3.axisBottom()
            .scale(xScale)
            .tickSize(0)
            .tickPadding([10])
            .tickFormat(d3.timeFormat("%b %-d"))    

        const xAxis = group.append("g")
            .call(xAxisGenerator)
                .style("transform", `translateY(${height}px)`)
                .attr("stroke-opacity", 0.0)
                .attr("font-size", "1em")
                .attr("font-family", "sans-serif")

        const yAxisGenerator = d3.axisLeft()
            .scale(yScale)
            .ticks(5)
            .tickSize(0)

        if (config.currency_type == "dollar") {
            yAxisGenerator.tickFormat(d3.format("$,"))
        } 
        // yAxisGenerator.tickFormat((d)=> {
        //     console.log(d)
        //     return d
        // })
        // const yAxis = group.append("g")
        //     .call(yAxisGenerator)
        //         .style("transform", `translate(10,0)`)
        //         .attr("font-size", "1em")
        //         .attr("font-family", "sans-serif")

            if (config.label == "x-axis" || config.label == "both-axis") {
                const xAxisLabel = group.append("text")
                    .attr("x", (width)/2)
                    .attr("y", (height + margin.bottom - 4))
                    .attr("fill", "black")
                    .style("font-size", "1.4em")
                    .text((d) => {
                        return dimension.label
                    })
                    .style("text-anchor", "middle")
            }

            if (config.label == "y-axis" || config.label == "both-axis") {
              const yAxisLabel = yAxis.append("text")
                .attr("x", -30)
                .attr("y", -20)
                .attr("fill", "black")
                .style("font-size", "1.4em")
                .text((d) => {
                    return measure.label
                })
                .style("text-anchor", "start")
            }

                

        let minVal = d3.min(data_ready, d => valueAccessor(d))
        let maxVal = d3.max(data_ready, d => valueAccessor(d))

        var labelVals = [minVal, maxVal]

        const barText = group.append("g")
            .selectAll("text")
            .data(data_ready)
            .enter()
            .append("text")
                .attr("x", d => xScale(groupAccessor(d)) + xScale.bandwidth()/2)
                .attr("y", d => yScale(valueAccessor(d)) - 6)
                .text(d => {

                    if (labelVals.includes(valueAccessor(d))) {
                       if (config.currency_type == "dollar") {
                        return d3.format("$,.0f")(valueAccessor(d))
                    } else {
                        return d3.format(",.0f")(valueAccessor(d))
                        }
                    } else {
                        return 
                    }
                })
                .style("text-anchor", "middle")
                .attr("fill", "#323232")
                .attr("font-size", "0.75em")
                .attr("font-family", "sans-serif")

     
    }   catch(error) {
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
})