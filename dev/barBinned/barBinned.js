d3.json("http://localhost:3001/dataBarBins").then(function(loadin) {

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

    console.log("dimensions", dimension)
    console.log("measures", measures)
    console.log("data", data)

    // --------------------------------------------------------

    // this only works in d3 v7, not v5
    const bin1 = d3.bin() // divides data into buckets of equal width

    const values = []
    data.forEach(d => {
        values.push(d[dimension[0].name].value)
    })

    const buckets1 = bin1(values)

    console.log("buckets", buckets1)
    // console.log("bin.value", bins.values)

    // --------------------------------------------------------
    // d3.bin().value allows you to bin objects based on their property value p

    const valueLabels = Array.from(values, (d, i) => ({
        label: i,
        p: d
    }))

    const bin2 = d3.bin().value(d => d.p);
    const buckets2 = bin2(valueLabels)

    // d3.bin().domain defines the lowest and highest value to be considered
    const bin3 = d3.bin().domain([0, d3.max(values)])
    console.log("bin3", bin3.domain()(values)) // prints the domain

    // --------------------------------------------------------
    // create a "nice" scale - don't understand this code completely

    const scale = d3.scaleLinear()
        .domain(d3.extent(values))
        .nice();
    const bin4 = d3.bin().domain(scale.domain())
    console.log("bin4", bin4.domain()()) // don't understand this


































    // const colors = ["black"]
    //     .concat(d3.schemeCategory10)
    //     .concat(d3.schemePaired)
    //     .concat(d3.schemePastel1)
    //     .concat(d3.schemePastel2)

    // function draw_buckets(bin, values) {
    //     const svg = d3.select("svg")
      
    //     const buckets = bin(values);
      
    //     const binColor = d3
    //       .scaleThreshold()
    //       .domain(buckets.map(d => d.x0))
    //       .range(colors);
      
    //     // d3.select(svg)
    //       svg.selectAll("rect")
    //       .data(buckets)
    //       .join("rect")
    //       .attr("y", d => 10)
    //       .attr("height", 100 - 2 * 10)
    //       .attr("x", d => (x(d.x0) + 1) | 0)
    //       .attr("width", d => (x(d.x1) | 0) - (x(d.x0) | 0) - 2)
    //       .attr("stroke", d => binColor(d.x0))
    //       .attr("stroke-width", 1)
    //       .attr("stroke-dasharray", d => (d.length === 0 ? "1 5" : null))
    //       .attr("fill", "none");
      
    //     draw_values(svg, values);
      
    //     d3.select(svg)
    //       .selectAll("circle")
    //       .attr("fill", binColor)
    //       .attr("stroke", binColor);
      
    //     d3.select(svg)
    //       .selectAll("text")
    //       .data(buckets.filter(d => d.length > 0))
    //       .join("text")
    //       .attr("x", d => (x(d.x0) + 3) | 0)
    //       .attr("y", 86)
    //       .attr("fill", "black")
    //       .attr("font-size", 9)
    //       .text(d =>
    //         x(d.x1) - x(d.x0) < 50
    //           ? d.length
    //           : d.length > 1
    //           ? `${d.length} items`
    //           : d.length === 1
    //           ? "1 item"
    //           : "empty bin"
    //       );
      
    //     return svg;
    //   }

    //   draw_buckets(bins, values)

})