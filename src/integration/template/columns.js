export const object = {
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
          default: "dollar"
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
                bottom: 40,
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
            entry["group"] = d[dimension.name].value
            entry["value"] = d[measure.name].value
            data_ready.push(entry)
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
                .attr("font-weight", "600")
                

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
}