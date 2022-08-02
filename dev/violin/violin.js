import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({
  // Id and Label are legacy properties that no longer have any function besides documenting
  // what the visualization used to have. The properties are now set via the manifest
  // form within the admin/visualizations page of Looker
  id: "violin",
  label: "ZDev Violin",
  options: {
    thresholds: {
      type: 'string',
      label: 'Thresholds',
      display: "radio",
      values: [
        {"5": "5"},
        {"10": "10"},
        {"15": "15"},
        {"20": "20"},
        {"25": "25"},
        {"30": "30"}
      ],
      default: "15"
    },
    statistics: {
      type: 'string',
      label: 'Statistics',
      display: "radio",
      values: [
        {"Mean": "mean"},
        {"Median": "median"},
        {"None": "none"}
      ],
      default: "mean"
    },
  },
  // Set up the initial state of the visualization
  create: function(element, config) {
    // Insert a <style> tag with some styles we'll use later.
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
      min_pivots: 0, max_pivots: 1,
      min_dimensions: 1, max_dimensions: 2,
      min_measures: 1, max_measures: 1
    })) return

    function find_median(numbers) {
        const sorted = Array.from(numbers).sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);

        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }

        return sorted[middle];
    }

    try {
    
    const svg = (
      d3.select(element).select('svg')
        .html('')
        .attr('width', '100%')
        .attr('height', '100%')
    )

    // Get the shape of the data, this chart can take two dimensions or a pivot on the shorter dimension
    let ispivot = false
    const dimensions = queryResponse.fields.dimension_like
    const measure = queryResponse.fields.measure_like[0]
    const pivots = queryResponse.fields.pivots

    if (dimensions.length == 1 && pivots.length == 1) {
        ispivot = true
    }

    // console.log(queryResponse, data)
    console.log(dimensions, measure, pivots)

    const parseDate = d3.timeParse("%-m/%-d/%Y")
    const monthFormat = d3.timeFormat("%b")  
    const groupAccessor = d => d.group
    const valueAccessor = d => d.value
    const dateAccessor = d => d.date

    let data_ready = []

    if (ispivot == false) {
        data.forEach((d)=>{
            let entry = {}
            entry["group"] = d[dimensions[0].name].value
            entry["to_measure"] = d[dimensions[1].name].value
            entry["value"] = d[measure.name].value
            data_ready.push(entry)
        })
    } else if (ispivot == true) {
        const pivot_name = pivots[0].name
        const pivot_column_labels = queryResponse.pivots

        data.forEach((d)=>{
            const keys = Object.keys(d[measure.name])
            keys.forEach(function(val) {
                if (d[measure.name][val].value != null) {
                    let entry = {}
                    entry["group"] = val
                    entry["to_measure"] = d[dimensions[0].name].value
                    entry["value"] = d[measure.name][val]["value"]
                    data_ready.push(entry)
                }
            })
            
        });
    }

    console.log(data_ready)

    const colors = ["#27566b","#8cbb61","#007b82","#8cbb61","#339f7b","#d8d9dd"]
    
    const margin = {top: 10, right: 10, bottom: 42, left: 44};
    const width = element.clientWidth - margin.left - margin.right;
    const height = element.clientHeight - margin.top - margin.bottom;

    // Clear any errors from previous updates
    this.clearErrors();

    const group = svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')').attr('width', "100%")
      .attr('height', (height + "px")).classed("group", true)

    // const months = d3.timeMonths(...d3.extent(data_ready, dateAccessor))

    // monthNames = []
    // months.forEach(i => {
    //     monthNames.push(monthFormat(i))
    // })


    let buckets = {}
    if (ispivot == false) {
        buckets["label"] = dimensions[0].label
    } else if (ispivot == true) {
        buckets["label"] = pivots[0].label
    }
    
    let bucket_data = []

    if (parseDate(data_ready[0]["group"])) {
        bucket_data = monthNames
        } else {
            data_ready.forEach(function(d){
                if (bucket_data.includes(d.group)) {
                    return
                } else {
                    bucket_data.push(d.group)
                }
            })
    }
    

    buckets["range"] = bucket_data

    const xScale = d3.scaleBand()
        .domain(buckets.range)
        .range([0, width])
        .padding(0.05)

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data_ready, (d)=>{
            return d.value
        }))
        .range([height, 0])

    const zScale = d3.scaleOrdinal()
        .domain(buckets.range)
        .range(colors)


    const binsGenerator = d3.histogram()
        .domain(yScale.domain())
        .value((d) => {
            return d})
        .thresholds(+config.thresholds)
console.log(data_ready.left)
    const groupBins = d3.nest()
            .key(function(d){
                return d.group
            })
            .rollup(function(r) {
              const input = r.map(function(g) { return g.value;})
              const bins = binsGenerator(input)   
              return(bins)
            })
            .entries(data_ready)

    let yMax = ""
    groupBins.forEach(function(value,key){
        yMax = (value.value.slice(-1)[0]["x0"])
    })

    yScale.domain([d3.min(data_ready, (d)=>{
            return d.value
        }),yMax])

    let maxNum = 0
    groupBins.forEach((value, key) => {

        const findLengthFrom = value.value
        const flat = value.value.flat()

        value["mean"] = flat.reduce((acc, c) => {
          return acc + c;
        }, 0) / flat.length;

        value["median"] = find_median(flat)
        value["none"] = 0

        const lengths = findLengthFrom.map(function(a) {return a.length})
        const longest = d3.max(lengths)
        if (longest > maxNum) {maxNum = longest}
    })

    var xNum = d3.scaleLinear()
        .domain([-maxNum, maxNum])
        .range([0, xScale.bandwidth()])

    // // draw data
    const violins = group.selectAll(".violin")
        .data(groupBins)
        .enter()
        .append("g")
            .attr("transform", function(d) {
                return (`translate(` + xScale(d.key) +` ,0)`)
            })
            .attr("class", "violin")
                        .style("fill", (d,i)=>{
                return zScale(d.key)
            })
        .append("path")
            .datum(function(d) {

                    return (d.value)})
            .style("stroke", "none")
            .attr("d", d3.area()
                .x0(function(d) {return xNum(-d.length)})
                .x1(function(d) {return xNum(d.length)})
                .y(function(d) {return yScale(d.x0)})
                .curve(d3.curveCatmullRom))
           
    const stats_marker = group.selectAll(".rect")
        .data(groupBins)
        .enter()
        .append("g")
            .attr("transform", function(d) {
                return (`translate(` + xScale(d.key) +` ,0)`)
            })
            .attr("class", "rect")
            .append("rect")
                .attr("x", xScale.bandwidth()/4)
                .attr("y", (d)=>{
                    return yScale(d[config.statistics])
                })
                .attr("width", xScale.bandwidth()/2)
                .attr("height", 2)
                .attr("fill", "gray")

    // // draw peripherals
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
        .attr("x", width/2)
        .attr("y", (margin.bottom - 8))
        .attr("fill", "black")
        .style("font-size", "1.2em")
        .text((d)=>{
            return buckets.label
        })
        .style("text-anchor", "middle")
    const yAxisLabel = yAxis.append("text")
        .attr("x", (-height/2))
        .attr("y", -margin.left + 18)
        .attr("fill", "black")
        .style("font-size", "1.2em")
        .text((d)=>{
            return measure.label
        })
        .style("transform", "rotate(-90deg)")
        .style("text-anchor", "middle")

    } catch(error) {
        if (queryResponse.fields.dimensions.length > 2 || queryResponse.fields.dimensions.length < 1 || queryResponse.fields.dimensions.length == 1 && queryResponse.fields.pivots.length != 1 ) {
          this.addError({title: "Dimension/Pivot Error", message: "This chart takes two dimensions or one pivot on a single dimension."});
          return;
        } 
    }
    
    // Callback at the end of the rendering to let Looker know it's finished
    done()
  }
});