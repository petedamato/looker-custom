d3.json("http://localhost:3001/dataColoredBar").then(function(loadin) {

    // set dimensions
    const margin = {
        top: 20,
        right: 10,
        bottom: 80,
        left: 60
    }

    const width = 800 //- margin.left - margin.right;
    const height = 600 //- margin.top - margin.bottom;

    const boundedHeight = height - margin.top - margin.bottom
    const boundedWidth = width - margin.left - margin.right

    const svg = (
        d3.select("#wrapper").append("svg")
            .html("")
            .attr("width", width)
            .attr("height", height)
    )

    const group = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .classed("group", true)


    const dimension = loadin.queryResponse.fields.dimension_like
    const measures = loadin.queryResponse.fields.measure_like
    const data = loadin.data

    console.log("dimensions", dimensions)
    console.log("measures", measures)
    console.log("data", data)

})