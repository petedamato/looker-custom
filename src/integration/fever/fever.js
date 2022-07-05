export const object = {
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker.

    id: "line-chart",
    label: "ZDev Line Chart",
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
        if (environment == "prod") {
            if (!handleErrors(this, queryResponse, {
                min_pivots: 0, max_pivots: 0,
                min_dimensions: 0, max_dimensions: 5,
                min_measures: 0, max_measures: 5
            })) return
        }
    
    try {

    console.log(data, queryResponse)

    const parseTime = d3.timeParse("%Y-%m-%d");

    const dimensions_ordered = queryResponse.fields.dimension_like
    const measures_ordered = queryResponse.fields.measure_like

    let dimensions = {
        margin: {
            top: 15,
            right: 130,
            bottom: 15,
            left: 40
        }
    }
    data.forEach(function(d) {
        dimensions_ordered.forEach(function(j, index) {
          const variable_name = "date" + (index + 1)
          d[variable_name] = parseTime(d[j.name].value);
        })
        measures_ordered.forEach(function(j, index) {
          const variable_name = "value" + (index + 1)
          if (d[j.name].value == null) {
            d[variable_name] = null;
          } else {
            d[variable_name] = +d[j.name].value;
          }
          
        })
    })

    console.log(data)
    // const w = element.clientWidth;
    // const h = element.clientHeight;

    // dimensions.boundedWidth = w - dimensions.margin.left - dimensions.margin.right;
    // dimensions.boundedHeight = Math.min(h - dimensions.margin.top - dimensions.margin.bottom,120)

    // const svg = (
    //   d3.select(element).select('svg')
    //     .html('')
    //     .attr('width', '100%')
    //     .attr('height', '100%')
    // )

    // const group = svg.append('g')
    //     .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
    //     .attr("width", "100%")
    //     .attr("height", ((dimensions.boundedHeight) + "px"))
    //         .classed("group", true)

    // // build scales
    // const xMetrics = ["metric"]

    // const xScale = d3.scaleLinear()
    //              .domain([0, d3.max(final_data,function(d,i) {
    //                 return Math.max(+d[0].value,+d[1].value)
    //                 })])
    //              .range([0, dimensions.boundedWidth])

    // const yScale = d3.scaleBand()
    //     .domain(xMetrics.map(d => d))
    //     .range([0, dimensions.boundedHeight])
    //     .padding(0.45)


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
};