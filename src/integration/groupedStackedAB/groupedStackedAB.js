import * as d3 from 'd3'
import * as $ from 'jquery'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({
  // Id and Label are legacy properties that no longer have any function besides documenting
  // what the visualization used to have. The properties are now set via the manifest
  // form within the admin/visualizations page of Looker
  id: "stacked-and-grouped",
  label: "ZDev Stacked and Grouped",
  options: {},
  // Set up the initial state of the visualization
  create: function(element, config) {
    // Insert a <style> tag with some styles we'll use later.
    element.innerHTML = `
      <style>
        body {
          font-family: Arial;
          font-size: 12px;
        }
        #test .item {
          shape-rendering: crispEdges;
          stroke-dasharray: 0;
          stroke-dashoffset: 0;
          transition: all .1s;
          cursor: pointer;
        }
        .drop-shadow-text {
            stroke-width: 4px;
            opacity: 0.6;
            stroke: white;
        }
        .line {
          fill: none;
          stroke: rgba(39, 86, 107,1);
          stroke-width: 2px;
        }
        .line2 {
              fill: none;
          stroke: rgba(140, 187, 97,1);
          stroke-width: 2px;
          
        }
      </style>
      <svg>
      </svg>`;
    element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`

  },
  // Render in response to the data or settings changing
  updateAsync: function(data, element, config, queryResponse, details, done) {
    if (!handleErrors(this, queryResponse, {
      min_pivots: 1, max_pivots: 1,
      min_dimensions: 1, max_dimensions: undefined,
      min_measures: 0, max_measures: 4
    })) return

    const margin = {top: 80, right: 20, bottom: 20, left: 40};
    const width = element.clientWidth - margin.left - margin.right;
    const height = element.clientHeight - margin.top - margin.bottom;

    const dimension = queryResponse.fields.dimension_like[0]
    const measures = queryResponse.fields.measure_like
    const pivots = queryResponse.fields.pivots
    const dataColumns = Object.keys(data[0]).splice(1)
    const pivotedColumns = Object.keys(data[0][dataColumns[0]])
    const dat_data = data;

    let manip_data = []

    dat_data.forEach(function(d) {
      let group = {}
      group["period"] = d[dimension.name]["value"]
      let out_group = {}
      for (let i = 0; i < pivotedColumns.length; i++) {
        let inner_group = {}
        for (let j = 0; j < dataColumns.length; j++) {
          if (j == 1) {
            inner_group[dataColumns[j]] = d[dataColumns[j]][pivotedColumns[i]].value - d[dataColumns[j-1]][pivotedColumns[i]].value
          } else {
            inner_group[dataColumns[j]] = d[dataColumns[j]][pivotedColumns[i]].value
          }
        }
        out_group[pivotedColumns[i]] = inner_group
        group["group"] = out_group
      }

      manip_data.push(group)
    })

    // Clear any errors from previous updates
    this.clearErrors();

    console.log(dimension, dat_data)
    console.log(this, element)
    const svg = (
      d3.select(element).select('svg')
        .html('')
        .attr('width', '100%')
        .attr('height', '100%')
    )

    const parseDate = d3.timeParse("%Y-%m-%d")
    const formatDate = d3.timeFormat("%b %d, '%y")

    const heightA = height * (1/3),
      heightB = height/3

    const groupA = svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')').attr('width', "100%")
      .attr('height', ((heightA - margin.top - margin.bottom) + "px")).classed("groupA", true)



    const groupB = svg.append('g').attr('width', "100%").attr('height', ((heightB - margin.top - margin.bottom) + "px")).attr('transform', 'translate(' + margin.left + ',' + (heightA + margin.top + margin.top) + ')').classed("groupB", true)


    const usable_data = manip_data

    let dimensions = []

    const stripedPattern = (function(){
      for(var i = 0, ii = usable_data.length; i<ii; i++){
        //implement checker: check for real month
        if(usable_data[i].period==='2022-05-16'){
          return {periodName: '2022-05-16'};
        }
      }
    })()

    //d3 scale stuff
    //x0 gets reused later
    const x0 = d3.scaleBand().rangeRound([0, width]).padding(0.1)
    const x1 = d3.scaleBand()
    const y = d3.scaleLinear().range([heightA, 0])
    let yBegin;

    //fetch the column headers
    const itemLookup= usable_data[0]
    const groups = Object.keys(itemLookup.group)
    const segments = Object.keys(itemLookup.group[groups[0]])

    const columnHeaders = []

    const innerColumns = (function(){
      var result = {};
      for(var i = 0, ii = groups.length; i<ii; i++){
        var holder = [];
        for(var j = 0, jj = segments.length; j<jj; j++){
          columnHeaders.push(segments[j]+'-'+groups[i]);
          holder.push(segments[j]+'-'+groups[i]);
          result[groups[i]] = holder;
        }
      }
      return result;
    })()

    //holder for the data obj rebuild
    const dataRebuild = [];
    // Determine the shape of the dataset in order to match colors to it.
    dimensions = [groups.length, segments.length]



    usable_data.forEach(function(d, i){
      var tempData = {},
          curGroup;
      tempData.periodName = d.period;
      if(d.period === stripedPattern.periodName){
        // chart
        //   .select('svg')
        //   .append('defs');
      }
      for(var key in d.group){
        if(curGroup != key){
          curGroup = key;
          tempData['totalValue-'+curGroup] = 0;
        }
        var holder = d.group[key];
        for(var item in holder){
          tempData[item+'-'+key] = holder[item];
          tempData['totalValue-'+curGroup] += parseInt(holder[item]);
        }
      }
      dataRebuild.splice(i, 0, tempData);
    });

    //refactor needed
    dataRebuild.forEach(function(d) {
      var yColumn = new Array();
      d.columnDetails = columnHeaders.map(function(name) {
        for (var ic in innerColumns) {
          if($.inArray(name, innerColumns[ic]) >= 0){
            if (!yColumn[ic]){
              yColumn[ic] = 0;
            }
            yBegin = yColumn[ic];
            yColumn[ic] += +d[name];
            return {
              name: (function(){
                var n = name.indexOf('-');
                return name.substring(0, n != -1 ? n : name.length);
              })(),
              value: +d[name],
              group: ic,
              yBegin: yBegin,
              yEnd: +d[name] + yBegin
            };
          }
        }
      });

      d.total = d3.max(d.columnDetails, function(d) {
        return d.yEnd;
      });

    });

    //get month names
    x0.domain(dataRebuild.map(function(d) { return parseDate(d.periodName); }));

    //get something
    x1.domain(Object.keys(innerColumns)).rangeRound([0, x0.bandwidth()],.01,0);

    //set y domain, get totals
    y.domain([0, d3.max(dataRebuild, function(d) {
      return d.total;
    })]);

    var stackedBars = groupA.selectAll(".stackedBars")
    .data(dataRebuild)
    .enter().append('g')
    .attr("class",function(d) {
      return 'month-col ' + parseDate(d.periodName);})
    .attr("transform", function(d) {
      return "translate(" + x0(parseDate(d.periodName)) + ",0)";})

    var bars = stackedBars.selectAll("rect")
    .data(function(d) { return d.columnDetails; });
    const colorMaker = ["rgba(39, 86, 107,", "rgba(140, 187, 97,","rgba(0, 123, 130,","rgba(241,205,86,"]
    var colors = [];

    for (let i = 0; i < dimensions[0]; i++) {
      for (let j = 0; j < dimensions[1]; j++) {
        colors.push(colorMaker[i] + String(1 - (j * .3)) + ")")
      }
    }

    bars
      .enter().append("rect")
      .attr("class", "item")
      .attr("x", function(d){ return x1(d.group)+1})
      .attr("width", x1.bandwidth())
      .attr("y",function(d) {
        return y(d.yEnd)})
      .attr("height", function(d){
        return y(d.yBegin) - y(d.yEnd)-1;
      })
      .attr("fill", function(d,i){
        return colors[i];})

    bars
      .enter().append("text")
      .attr("class", "item-text")
      .attr("x", function(d){ return x1(d.group)+x1.bandwidth()/2})
      .attr("y",function(d) {
        return y(d.yEnd) - 4})
      .attr("fill", function(d,i){
        return "#22282B"})
      .attr("text-anchor", "middle")
      .text((d)=> {
        if (d.value > 0) {
          return d.value
        } else 
          {
          return ""
        }
         })



    //legend items
    groupA.selectAll(".month-col")
      .data(dataRebuild)
      .append('g')
      .attr("class",'legend-item')
      .attr("text-anchor", "middle")
      .attr("transform", function(d) {
        return "translate(" +svg.select('.item').attr('width') +','+parseInt(heightA + 16)+ ")";
      })
        .append('text')
        .text(function(d){ return formatDate(parseDate(d.periodName)) });

    //totals
    groupA.selectAll(".month-col")
      .data(dataRebuild)
      .append('g')
      .attr("class", "test");

      groupA.append("g")
          .attr("transform", "translate(" + -4 + ",0)")
          .call(d3.axisLeft(y).tickFormat(function(d){
            return d
          }).tickSize(0).ticks(4));

        groupA.append("text")
          .attr("transform", "translate(" + -24 + ",-4)")
          .attr("font-weight", "bold")
          .text("Predicted appointment - successfully scheduled | not scheduled")

      var legend = groupA.selectAll(".legend")
        .data(groups)
      .enter()
        .append("g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { return "translate(" + (-40 + (i * 110) - width/2.05) + "," + (-margin.top/2) + ")"; });

        legend.append("circle")
            .attr("cx", width - 12)
            .attr("cy", 9)
            .attr("r", 7)
            .style("fill", (d,i)=>{
              return colors[i*2] 
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

    const line = d3.line()
        .x(function(d, i) {
            return x0(parseDate(d.periodName));
        })
        .y(function(d, i) {
          const denominator = dataColumns[1] + "-" + pivotedColumns[0]
          const numerator = dataColumns[0] + "-" + pivotedColumns[0]
          return yB(d[numerator] / (d[denominator] + d[numerator]));
        });

    const line2 = d3.line()
        .x(function(d, i) {
            return x0(parseDate(d.periodName));
        })
        .y(function(d, i) {
          const denominator = dataColumns[1] + "-" + pivotedColumns[1]
          const numerator = dataColumns[0] + "-" + pivotedColumns[1]
          return yB(d[numerator] / (d[denominator] + d[numerator]));
        });

const marginB = {top: 35, right: 20, bottom: 20, left: 40},
  yB = d3.scaleLinear().range([heightB, 0]).domain([0,1])

  groupB.append("g")
      .attr("transform", "translate(" + -4 + ",0)")
      .call(d3.axisLeft(yB).tickFormat(function(d){
        return d*100 + "%"
      }).tickSize(0).ticks(4));

    groupB.append("text")
      .attr("transform", "translate(" + (-30) + ",-12)")
      .attr("text-anchor", "beginning")
      .attr("font-weight", "bold")
      .text("Conversion Rate")

const path = groupB.append("path")
      .data([dataRebuild])
      .attr("class", "line")
      .attr("d", line)
      .attr('transform', 'translate(' + ( x0.bandwidth()/2 ) + ',' + 0 + ')')
      .attr("fill", "rgba(39, 86, 107,1)");

const dot = groupB.selectAll(".dot")
      .data(dataRebuild)
      .enter().append('g')
        .attr('transform', 'translate(' + ( x0.bandwidth()/2 ) + ',' + 0 + ')')
        .attr("class","dot")
        

dot.append("circle")
        .classed('dot-boi',true).attr("r",6)
      .attr("cx", function(d){ // This places the circles on the chart, using scaled x vals
        return x0(parseDate(d.periodName));
      })
      .attr("cy", function(d){ 
        const denominator = dataColumns[1] + "-" + pivotedColumns[0]
        const numerator = dataColumns[0] + "-" + pivotedColumns[0]
        return yB(d[numerator] / (d[denominator] + d[numerator]));
      })
      .attr("fill", "rgba(39, 86, 107,1)")

dot.append("circle")
        .classed('dot-pupil',true).attr("r",3)
      .attr("cx", function(d){ // This places the circles on the chart, using scaled x vals
        return x0(parseDate(d.periodName));
      })
      .attr("cy", function(d){ 
        const denominator = dataColumns[1] + "-" + pivotedColumns[0]
        const numerator = dataColumns[0] + "-" + pivotedColumns[0]
        return yB(d[numerator] / (d[denominator] + d[numerator]));
      })
      .attr("fill", "#e9eef0")

dot.append("text")
      .classed("drop-shadow-text", true)
      .attr("x", function(d){ // This places the circles on the chart, using scaled x vals
        return x0(parseDate(d.periodName));
      })
      .attr("y", function(d){ 
        const denominator = dataColumns[1] + "-" + pivotedColumns[0]
        const numerator = dataColumns[0] + "-" + pivotedColumns[0]
        return yB(d[numerator] / (d[denominator] + d[numerator])) - 8;
      })
      .attr("text-anchor","middle")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .text((d)=>{
                const denominator = dataColumns[1] + "-" + pivotedColumns[0]
        const numerator = dataColumns[0] + "-" + pivotedColumns[0]
        return String(Math.round(d[numerator] * 100 / (d[denominator] + d[numerator]),0)) + "%"
      })

dot.append("text")
      .attr("x", function(d){ // This places the circles on the chart, using scaled x vals
        return x0(parseDate(d.periodName));
      })
      .attr("y", function(d){ 
        const denominator = dataColumns[1] + "-" + pivotedColumns[0]
        const numerator = dataColumns[0] + "-" + pivotedColumns[0]
        return yB(d[numerator] / (d[denominator] + d[numerator])) - 8;
      })
      .attr("text-anchor","middle")
      .attr("fill", "rgba(39, 86, 107,1)")
      .text((d)=>{
        const denominator = dataColumns[1] + "-" + pivotedColumns[0]
        const numerator = dataColumns[0] + "-" + pivotedColumns[0]
        return String(Math.round(d[numerator] * 100 / (d[denominator] + d[numerator]),0)) + "%"
      })

const path2 = groupB.append("path")
      .data([dataRebuild])
      .attr("class", "line2")
      .attr("d", line2)
      .attr('transform', 'translate(' + ( x0.bandwidth()/2 ) + ',' + 0 + ')')
      .attr("fill", "black");

const dot2 = groupB.selectAll(".dotB")
      .data(dataRebuild)
      .enter().append('g')
      .attr('transform', 'translate(' + ( x0.bandwidth()/2 ) + ',' + 0 + ')')
      .attr("class","dotB")
        

dot2.append("circle")
        .classed('dot-boi',true).attr("r",6)
      .attr("cx", function(d){ // This places the circles on the chart, using scaled x vals
        return x0(parseDate(d.periodName));
      })
      .attr("cy", function(d){ 
        const denominator = dataColumns[1] + "-" + pivotedColumns[1]
        const numerator = dataColumns[0] + "-" + pivotedColumns[1]
        return yB(d[numerator] / (d[denominator] + d[numerator]));
      })
      .attr("fill", "rgba(140, 187, 97,1)")

dot2.append("circle")
        .classed('dot-pupil',true).attr("r",3)
      .attr("cx", function(d){ // This places the circles on the chart, using scaled x vals
        return x0(parseDate(d.periodName));
      })
      .attr("cy", function(d){ 
        const denominator = dataColumns[1] + "-" + pivotedColumns[1]
        const numerator = dataColumns[0] + "-" + pivotedColumns[1]
        return yB(d[numerator] / (d[denominator] + d[numerator]));
      })
      .attr("fill", "#e9eef0")

dot2.append("text")
      .classed("drop-shadow-text", true)
      .attr("x", function(d){ // This places the circles on the chart, using scaled x vals
        return x0(parseDate(d.periodName));
      })
      .attr("y", function(d){ 
        const denominator = dataColumns[1] + "-" + pivotedColumns[1]
        const numerator = dataColumns[0] + "-" + pivotedColumns[1]
        return yB(d[numerator] / (d[denominator] + d[numerator])) + 18;
      })
      .attr("text-anchor","middle")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .text((d)=>{
        const denominator = dataColumns[1] + "-" + pivotedColumns[1]
        const numerator = dataColumns[0] + "-" + pivotedColumns[1]
        return String(Math.round(d[numerator] * 100 / (d[denominator] + d[numerator]),0)) + "%"
      })

dot2.append("text")
      .attr("x", function(d){ // This places the circles on the chart, using scaled x vals
        return x0(parseDate(d.periodName));
      })
      .attr("y", function(d){ 
        const denominator = dataColumns[1] + "-" + pivotedColumns[1]
        const numerator = dataColumns[0] + "-" + pivotedColumns[1]
        return yB(d[numerator] / (d[denominator] + d[numerator])) + 18;
      })
      .attr("text-anchor","middle")
      .attr("fill", "rgba(140, 187, 97,1)")
      .text((d)=>{
        const denominator = dataColumns[1] + "-" + pivotedColumns[1]
        const numerator = dataColumns[0] + "-" + pivotedColumns[1]
        return String(Math.round(d[numerator] * 100 / (d[denominator] + d[numerator]),0)) + "%"
      })

    // Custom error handling that signals the shape of the data is wrong
        if (queryResponse.fields.dimensions.length == 0) {
          this.addError({title: "No Dimensions", message: "This chart requires dimensions."});
          return;
        } else if (config.chart_type == "area" && config.chart_type == "dot") {
          this.addError({title: "No Chart Type", message: "Select either Area or Dot from the options."});
          return;
        } else if (queryResponse.fields.measures.length < 2 || queryResponse.fields.measures.length > 2) {
          this.addError({title: "Measure Error", message: "This chart type can only display two measures at a time."});
          return;
        } 
    // Callback at the end of the rendering to let Looker know it's finished
    done()
  }
});
