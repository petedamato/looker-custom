import * as d3 from 'd3'
import * as $ from 'jquery'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({
  // Id and Label are legacy properties that no longer have any function besides documenting
  // what the visualization used to have. The properties are now set via the manifest
  // form within the admin/visualizations page of Looker
  id: "stacked-and-grouped",
  label: "ZDev Stacked and Grouped",
  options: {
    labelPositions: {
      type: 'string',
      label: 'Label Positions',
      display: "radio",
      values: [
        {"Centered": "centered"},
        {"Staggered": "staggered"}
      ],
      default: "centered"
    },
    show_null_points: {
      type: 'boolean',
      label: 'Plot Null Values',
      default: false
    }
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
      min_pivots: 1, max_pivots: 1,
      min_dimensions: 1, max_dimensions: undefined,
      min_measures: 0, max_measures: 4
    })) return

    const margin = {top: 80, right: 20, bottom: 20, left: 60};
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
            inner_group[dataColumns[j]] = d[dataColumns[j]][pivotedColumns[i]].value
        }
        out_group[pivotedColumns[i]] = inner_group
        group["group"] = out_group
      }

      manip_data.push(group)
    })

    // Clear any errors from previous updates
    this.clearErrors();


    const svg = (
      d3.select(element).select('svg')
        .html('')
        .attr('width', '100%')
        .attr('height', '100%')
    )

    // const parseDate = d3.timeParse("%Y-%m-%d")
    // const formatDate = d3.timeFormat("%b %d, '%y")

    const heightA = height

    const groupA = svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')').attr('width', "100%")
      .attr('height', ((heightA - margin.top - margin.bottom) + "px")).classed("groupA", true)


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
    x0.domain(dataRebuild.map(function(d) { return d.periodName; }));

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
      return 'month-col ' + d.periodName;})
    .attr("transform", function(d) {
      return "translate(" + x0(d.periodName) + ",0)";})

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
  .attr("x", function(d,i){ 
    if (config.labelPositions == "staggered") {
      if (i%2) {
        return x1(d.group) + x1.bandwidth() - 6
      } else {
        return x1(d.group) + 6
      }
    } else if (config.labelPositions == "centered") {
      return x1(d.group) + x1.bandwidth()/2
    }

  })
  .attr("y",function(d) {
    return y(d.yEnd) - 4})
  .attr("fill", function(d,i){
    return "#22282B"})
  .attr("text-anchor", function(d,i){ 
    if (config.labelPositions == "staggered") {
      if (i%2) {
        return "end"
      } else {
        return "beginning"
      }
    } else if (config.labelPositions == "centered") {
      return "middle"
    }

  })
  .text((d)=> {
    if (d.value) {
      return d.value
    } else {
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
        .text(function(d){ return d.periodName });

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
      .attr("transform", "translate(" + -24 + ",-29)")
      .attr("font-weight", "bold")
      .text(()=>{
        const text = Object.keys(dat_data[0]).filter(function(d){
          return d != queryResponse.fields.dimension_like[0].name
        }).join(" | ")

        return text
      })

  var legend = groupA.selectAll(".legend")
    .data(groups)
  .enter()
    .append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(" + (-40 + (i * 110) - width/2.05) + "," + (-margin.top*.9) + ")"; });

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

    if (queryResponse.fields.dimensions.length == 0) {
          this.addError({title: "No Dimensions", message: "This chart requires dimensions."});
          return;
        } else if (queryResponse.fields.pivots.length != 1) {
          this.addError({title: "Pivot Chart", message: "This chart requires one pivot"});
          return;
        } 

    // Callback at the end of the rendering to let Looker know it's finished
    done()
  }
});
