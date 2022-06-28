import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker.

    id: "split-violin",
    label: "ZDev Split Violin",
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
            min_pivots: 2, max_pivots: 2,
            min_dimensions: 1, max_dimensions: 1,
            min_measures: 1, max_measures: 1
        })) return

        try {
        

        var thresholdNum = 15
        const parseDate = d3.timeParse("%-m/%-d/%Y")
        const monthFormat = d3.timeFormat("%b")

        // require 2 pivots, 1 dimension, 1 measure
        const dimension = queryResponse.fields.dimension_like[0]
        const measure = queryResponse.fields.measure_like[0]
        const pivots = queryResponse.fields.pivots

        const legend_label = pivots[1].field_group_variant

        let data_ready = []



    data.forEach((d) => {
        for (const [key, value] of Object.entries(d[measure.name])) {
            let entry = {}

            entry["left"] = key.split("|FIELD|")[0]
            entry["right"] = key.split("|FIELD|")[1]
            entry["to_measure"] = d[dimension.name].value
            entry["value"] = value.value

            data_ready.push(entry)
        }
    })

    data_ready = data_ready.filter(function(entry) {
        return entry.right != "TXX Undefined"
    })

    const leftAccessor = d => d.left
    const rightAccessor = d => d.right
    const measureAccessor = d => d.to_measure
    const valueAccessor = d => d.value

    const colors = ["#27566b","#339f7b"]

    // // set dimensions and svg element
    const margin = {top: 60, right: 20, bottom: 46, left: 60};
    const width = element.clientWidth - margin.left - margin.right;
    const height = element.clientHeight - margin.top - margin.bottom;

    this.clearErrors();

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

    
    // define range of values for each group/pivot level
    let buckets = {}

    // if just need the highest pivot level to be used on x-axis
    buckets['label'] = pivots[0].label

    let bucket_data = []

    data_ready.forEach(function(d) {
        if (bucket_data.includes(d.left)) {
            return 
        } else {
            bucket_data.push(d.left)
        }
    })

    buckets['range'] = bucket_data

    bucket_data = []

    data_ready.forEach(function(d) {
        if (d.right.includes("Undefined") || bucket_data.includes(d.right)) {
            return 
        } else {
            bucket_data.push(d.right)
        }
    })

    buckets['lower_pivot'] = bucket_data

    // create scales
    const xScale = d3.scaleBand()
        .domain(buckets.range)
        .range([0, width])
        .padding(0.05)

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data_ready, (d) => {
            return d.value
        }))
        .range([height, 0])

    const zScale = d3.scaleOrdinal()
        .domain(buckets.lower_pivot)
        .range(colors)

    // v5 nest/histogram process, instead of d3.bin in v7
    const binsGenerator = d3.histogram()
        .domain(yScale.domain())
        .value(d => d)
        .thresholds(thresholdNum)

    const groupBins = d3.nest()
        .key(function(d) {
            return d.left
        })
        .key(function(d) {
            return d.right
        })
        .rollup(function(r) {
            let input = r.map(function(g) {return g.value})
            let bins = binsGenerator(input)
            return (bins)
        })
        .entries(data_ready)


    // // why do we have to loop through - aren't all the x0s the same?
    let yMax = ""
    groupBins.forEach((value, key) => {
        value.values.forEach((v, k) => {
            yMax = (v.value[v.value.length-1]["x0"])
        })
    })

    yScale.domain([d3.min(data_ready, (d) => {
        return d.value
    }), yMax])

    let maxDepth = 0
    groupBins.forEach((value, key) => {
        value.values.forEach((v, k) => {
            const findLengthFrom = v.value
            const lengths = findLengthFrom.map(function(a) {return a.length})
            const longest = d3.max(lengths)
            if (longest > maxDepth) {maxDepth = longest}
        })
    })

    var xNum = d3.scaleLinear()
        .domain([-maxDepth, maxDepth])
        .range([0, xScale.bandwidth()])

    // draw data
    const violins = group.selectAll(".violin")
        .data(groupBins)
        .enter()
        .append("g")
            .attr("transform", function(d) {
                return ("translate(" + xScale(d.key) + ",0)")
            })
            .attr("class", "violin")

    const leftViolins = violins.append("path")
            .datum(function(d) {
                return (d.values[0].value)
            })
            .style("stroke", "none")
            .style("fill", (d,i) => {
                return colors[0]
            })
            .attr("d", d3.area()
                .x0(function(d) {
                    return xNum(-d.length)})
                .x1(function(d) {return xNum(0)})
                .y(function(d) {return yScale(d.x0)})
                .curve(d3.curveMonotoneY))

    const rightViolins = violins
        .append("path")
            .datum(function(d) {
                return (d.values[1].value)
            })
            .style("stroke", "none")
            .style("fill", (d,i) => {
                return colors[1]
            })
            .attr("d", d3.area()
                .x0(function(d) {return xNum(0)})
                .x1(function(d) {return xNum(d.length)})
                .y(function(d) {return yScale(d.x0)})
                .curve(d3.curveMonotoneY))


    // draw peripherals
    const xAxisGenerator = d3.axisBottom()
        .scale(xScale)

    const xAxis = group.append("g")
        .call(xAxisGenerator)
            .style("transform", `translateY(${height}px)`)
            .attr("class", "axis")

    const yAxisGenerator = d3.axisLeft()
        .scale(yScale)

    const yAxis = group.append("g")
        .call(yAxisGenerator)
        .attr("class", "axis")

    const xAxisLabel = xAxis.append("text")
        .attr("x", (width-margin.left)/2)
        .attr("y", (margin.bottom-6))
        .attr("fill", "black")
        .style("font-size", "1.4em")
        .text((d) => {
            return buckets.label
        })
        .style("text-anchor", "middle")

    const yAxisLabel = yAxis.append("text")
        .attr("x", -height/2 + margin.top)
        .attr("y", -margin.left + 18)
        .attr("fill", "black")
        .style("font-size", "1.4em")
        .text((d) => {
            return measure.label
        })
        .style("transform", "rotate(-90deg)")
        .style("text-anchor", "middle")
    
    const legendContainer = group.append('g')
        .attr("transform", "translate(0, 0)")
            .classed("legendContainer", true)

    const legend = legendContainer.selectAll(".legend")
            .data(buckets.lower_pivot)
          .enter()
            .append("g")
              .attr("class", "legend")
              .attr("transform", function(d, i) { return "translate(" + (-40 + (i * 110) - width/2.05) + "," + (-margin.top/2) + ")"; });

                legendContainer.append("text")
                    .attr("x", (width - margin.left)/2)
                    .attr("y", -margin.top/2)
                    .attr("dy", "-0.2em")
                    .style("text-anchor", "middle")
                    .style("font-size",10)
                    .text(legend_label);

                legend.append("circle")
                    .attr("cx", width - 12)
                    .attr("cy", 9)
                    .attr("r", 7)
                    .style("fill", (d,i)=>{
                      return colors[i] 
                    });

                legend.append("text")
                    .attr("x", width - 24)
                    .attr("y", 9)
                    .attr("dy", ".35em")
                    .style("text-anchor", "end")
                    .style("font-size",10)
                    .text((d,i)=>{
                      return d
                      });

        } catch(error) {
            if (queryResponse.fields.dimensions.length > 1 ||
                queryResponse.fields.dimensions.length < 1 ||
                queryResponse.fields.pivots.length > 2 ||
                queryResponse.fields.pivots.length < 2 
                ) {
                    this.addError({title: "Dimension/Pivot Error", message: "This chart takes two pivots and one dimension."});
                    return;
                } else {
                    this.addError({title: "Data Error", message: "Check that your second pivot has only two options"});
                    return;
                }
        }

        // Callback at the end of the rendering to let Looker know it's finished
        done()
    }
});