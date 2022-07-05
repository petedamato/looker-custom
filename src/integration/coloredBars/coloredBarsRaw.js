import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker.

    id: "colored-bars-raw",
    label: "ZDev Colored Bars Raw",
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
    updateAsync: function(data, element, config, queryResponse, details, done) {
        if (!handleErrors(this, queryResponse, {
            min_pivots: 0, max_pivots: 0,
            min_dimensions: 1, max_dimensions: 1,
            min_measures: 1, max_measures: 1
        })) return
    
    try {

    const dimensionCreation = function() {
                const margin = {
                    top: 80,
                    right: 10,
                    bottom: 30,
                    left: 10
                }

                const width = element.clientWidth - margin.left - margin.right;
                const height = element.clientHeight - margin.top - margin.bottom;

                const svg = (
                    d3.select(element).select("svg")
                        .html("")
                        .attr("width", "100%")
                        .attr("height", "100%")
                )

                const group = svg.append("g")
                    .attr("transform", `translate(${margin.left}, ${margin.top})`)
                    .attr("width", "100%")
                    .attr("height", (height + "px"))
                    .classed("group", true)

                return [margin, width, height, svg, group]
            }


                // Get the shape of the data - this chart takes 1 dimension and 1 measure
                const dimension = queryResponse.fields.dimension_like[0]
                const measure = queryResponse.fields.measure_like[0]

                const parseDate = d3.timeParse("%Y-%m-%d")

                const groupAccessor = d => parseDate(d.group)
                const valueAccessor = d => +d.value.replace(/,/g, '')

                let data_ready = []

                data.forEach((d) => {
                    let entry = {}
                    entry["group"] = d[dimension.name].value
                    entry["value"] = d[measure.name].value
                    data_ready.push(entry)
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
                        .attr("fill", (d,i) => {
                            if (i==0) {
                                return "lightgrey"
                            } else {
                                const priorVal = valueAccessor(data_ready[i-1])
                                const currVal = valueAccessor(d)

                                if (currVal >= priorVal) {
                                    return "lightgrey"
                                } else {
                                    return "#D76106"
                                }
                            }
                        })

                // draw peripherals
                const xAxisGenerator = d3.axisTop()
                    .scale(xScale)
                    .tickSize(0)
                    .tickPadding([50])
                    .tickFormat(d3.timeFormat("%b %-d"))

                const xAxis = group.append("g")
                    .call(xAxisGenerator)
                        .attr("stroke-opacity", 0.0)
                        .attr("font-size", "0.8em")
                        .attr("font-family", "sans-serif")
                        .attr("font-weight", "600")

                minVal = d3.min(data_ready, d => valueAccessor(d))
                maxVal = d3.max(data_ready, d => valueAccessor(d))

                labelVals = [minVal, maxVal]

                const barText = group.append("g")
                    .selectAll("text")
                    .data(data_ready)
                    .enter()
                    .append("text")
                        .attr("x", d => xScale(groupAccessor(d)) + xScale.bandwidth()/2)
                        .attr("y", d => yScale(valueAccessor(d)) - 6)
                        .text(d => {
                            if (labelVals.includes(valueAccessor(d))) {
                                return d3.format(",.0f")(valueAccessor(d))
                            } else {
                                return 
                            }
                        })
                        .style("text-anchor", "middle")
                        .attr("fill", "#323232")
                        .attr("font-size", "0.75em")
                        .attr("font-family", "sans-serif")

    } catch(error) {
            if (queryResponse.fields.dimensions.length != 1 || 
                queryResponse.fields.measures.length != 1) {
                    this.addError({title: "Dimension/Pivot Error", message: "This chart takes 1 dimension and 1 measure."});
                    return;
                }
            }


        // Callback at the end of the rendering to let Looker know it's finished
        done()
    }
  });