export const object = {
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
           @font-face { 
                font-family: Roboto; 
                font-weight: 300; 
                font-style: normal;
                src: url('https://static-a.lookercdn.com/fonts/vendor/roboto/Roboto-Light-d6f2f0b9bd.woff') format('woff'),url('/fonts/vendor/roboto/Roboto-Light-d6f2f0b9bd.woff') format('woff');
              }
              @font-face { font-family: Roboto; font-weight: 400; font-style: normal;
                src: url('https://static-b.lookercdn.com/fonts/vendor/roboto/Roboto-Regular-5997dd0407.woff') format('woff'),url('/fonts/vendor/roboto/Roboto-Regular-5997dd0407.woff') format('woff');
              }
                @font-face { font-family: Roboto; font-weight: 500; font-style: normal;
                src: url('https://static-b.lookercdn.com/fonts/vendor/roboto/Roboto-Medium-e153a64ccc.woff') format('woff'),url('/fonts/vendor/roboto/Roboto-Medium-e153a64ccc.woff') format('woff');
              }
              @font-face { font-family: Roboto; font-weight: 700; font-style: normal;
                src: url('https://static-b.lookercdn.com/fonts/vendor/roboto/Roboto-Bold-d919b27e93.woff') format('woff'),url('/fonts/vendor/roboto/Roboto-Bold-d919b27e93.woff') format('woff');
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

            body {
                font-family: 'Roboto';
            }

            text {
                font-family: 'Roboto';
            }
            .domain {
                display: none;
            }
            .gridline{
                stroke: rgb(230, 230, 230);
                shape-rendering: crispEdges;
                stroke-opacity: 1;
            }
            .gridline2{
                stroke: white;
                shape-rendering: crispEdges;
                stroke-opacity: 1;
            }
            #viz-container {
              z-index: 9;
              position: relative;
              background-color: none;
              border: 1px solid #d3d3d3;
              text-align: center;
              width: 600px;
              height: 360px;
            }
            #dimension-header {
                font-size: 12px;
            }
            .value-headers {
                font-size: 12px;
            }
            .value-headers-body {
                font-weight: 500;
            }
            #viz {
              font-family: 'Open Sans', 'Helvetica', 'sans-serif';
              cursor: move;
              z-index: 10;
              background-color: none;
              color: #fff;
              height: 100%;
              width: 100%;
              fill: black;
              color: black;
            }

            .line {
              fill: none;
              stroke-width: 2px;
            }

            /* ---Cheryl's Stuff: Start--- */

            .axis-label {
              fill: #3a4245;
              font-size: 12px;
              font-family: 'Open Sans', 'Helvetica', 'sans-serif';
              text-anchor: middle;
            }

            .y-axis, .x-axis {
              font-family: 'Open Sans', 'Helvetica', 'sans-serif';
            }

            .x-axis .domain {
              stroke: #ccd6eb;
              stroke-width: 1;
            }

            .zero-line {
              stroke: #ccd6eb;
              stroke-width: 1.0;
            }

            .y-axis .domain {
              stroke: none;
            }

            .x-axis text, .y-axis text {
              font-size: 12px;
              color: #3a4245;
              visibility: visible;
            }

            .x-axis text .hide, .y-axis text .hide {
              visibility: hidden;
            }

            .x-axis line, .y-axis line {
              stroke: #e6e6e6;
              stroke-width: 1;
              opacity: 1;
            }

            .x-axis line .hide, .y-axis line .hide {
              opacity: 0;
            }

            /* ---Cheryl's Stuff: End--- */

            .axis text {
              /* fill: green;  */
              font-size: 12px;
            }

                        /* design */
            table {
               overflow-y:scroll;
               height:100%;
               font-size: 14px;
               display:block;}
            th {
                background: #a9a9a9;
                padding: 4px 0;
            }
            .tooltip {
                color: white;
                /*box-shadow: 2px 2px 5px;*/
            }
            tr:nth-child(even) { background: #EEE; }
              .value-down {
                color: #D76106;
                font-weight:500;
                                display:flex;
                justify-content: center;
              }
              .value-up {
                color: #0072b5;
                font-weight:500;
                                display:flex;
                justify-content: center;
              }
              .change-figure {
                line-height: 36px;
              }
            .first-svg {
                height: 50px!important;
                width: 120px!important;
            }
            .second-svg {
                height: 50px!important;
                width: 120px!important;
            }
            #menu-options p {
                font-weight: 500;
            }
            #vis-options-container {
                display: flex;
                margin: 12px 8px 4px;
            }
            #vis-options-container p {
                font-size: 14px;
                margin: 0 4px 0 0;
            }
            .backdrop {
                opacity: .5;
            }
      </style>
            <div id="vis-options-container"><p>Haul length category: </p>
          <select name="vis-options" id="vis-options">
          </select>
      </div>
      <svg>
      </svg>`;
    element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`

  },
  // Render in response to the data or settings changing
  updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
    if (environment == "prod") {
        if (!handleErrors(this, queryResponse, {
            min_pivots: 1, max_pivots: 1,
            min_dimensions: 1, max_dimensions: 40,
            min_measures: 1, max_measures: 40
        })) return
    }

    const margin = {top: 40, right: 30, bottom: 20, left:51};
    const getNode = d3.select("#vis");

    // Update this once we have a better idea how Looker integration will look
    const new_node_width = getNode.select(function() { return this.parentNode; })
    const new_node_height = getNode.select(function() { return this.parentNode; })
    const w = new_node_width.node().getBoundingClientRect().width;
    const h = new_node_height.node().getBoundingClientRect().height;

    const width = w - margin.left - margin.right;
    const height = h - margin.bottom - margin.top;

    const dimension = queryResponse.fields.dimension_like[0]
    const measures = queryResponse.fields.measure_like
    const pivotKeys = Object.keys(data[0][measures[0].name])

    let pivotKey = pivotKeys[pivotKeys.length - 1]

    const listPeg = $('#vis-options');

    listPeg.empty().append($('<option></option>').attr('value', pivotKeys[pivotKeys.length - 1]).text("All").attr("selected","selected"));

    pivotKeys.forEach((entry)=>{
      if (entry.includes("null") || entry.includes("$")) {
        return
      } else {
        listPeg.append($('<option></option>').attr('value', entry).text(entry.split("|")[0]));
      }
    })

    listPeg.on("change", function(){
      redraw()
    })  

    // const dataColumns = Object.keys(data[0]).splice(1)
    let pivotedColumns = Object.keys(data[0])
    let dataColumns = ["asp_quotes","price_requests.quoted_shipment_count","price_requests.available_shipment_count"]

    pivotedColumns = pivotedColumns.filter((entry)=>{
      return entry != dimension.name
    })

    function redraw() {

      pivotKey = $('#vis-options option:selected').val()

      d3.select("#vis")
            .select("svg").html("")

    // append the svg object to the body of the page
      var svg = d3.select("#vis")
      .select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const parseDate = d3.timeParse("%Y-%m")
    const formatDate = d3.timeFormat("%b %d, '%y")

    // //holder for the data obj rebuild
    let dataRebuild = [];
    let dataRebuildLine = [];
    // // Determine the shape of the dataset in order to match colors to it.
    let dimensions = [1, 3];

    data.sort((a,b)=>{
      return parseDate(a[dimension.name].value) - parseDate(b[dimension.name].value)
    })

    data.forEach(function(d) {
      let pod = {}
      let subpod = {}
      pod["group"] = d[dimension.name].value
      subpod["group"] = d[dimension.name].value
      for (let j = 0; j < dataColumns.length; j++) {
        subpod["wr"] = d["price_requests.win_percent"][pivotKey].value
        pod["total"] = d["price_requests.available_shipment_count"][pivotKey].value
        if (dataColumns[j] == "asp_quotes") {
          pod[dataColumns[j]] = d[dataColumns[j]][pivotKey].value
        } else if (dataColumns[j] == "price_requests.quoted_shipment_count") {
          pod[dataColumns[j]] = d[dataColumns[j]][pivotKey].value - d["asp_quotes"][pivotKey].value 
        } else {
          pod[dataColumns[j]] = d[dataColumns[j]][pivotKey].value - d["price_requests.quoted_shipment_count"][pivotKey].value 
        }
      }
      dataRebuild.push(pod)
      dataRebuildLine.push(subpod)
    })

    console.log()
    var stackedData = d3.stack()
        .keys(dataColumns)
          (dataRebuild)

    const heightA = height * (3/4),
      heightB = height/4 - 30

    const groupA = svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')').attr('width', "100%")
      .attr('height', ((heightA) + "px")).classed("groupA", true)

    svg.append('rect').attr('width', (width + margin.left/2 + margin.right/2))
        .attr('height', (heightB + 50 + "px"))
        .attr('transform', 'translate(' + 10 + ',' + (heightA + 12) + ')')
        .classed("backdrop", true).style("fill", "#e9eaf3")

    const groupB = svg.append('g').attr('width', "100%").attr('height', ((heightB - margin.top - margin.bottom) + "px")).attr('transform', 'translate(' + margin.left + ',' + ((heightA + margin.top/1.8) + 16) + ')').classed("groupB", true).style("background-color", "black")



    //d3 scale stuff
    const x = d3.scaleBand().rangeRound([0, width]).padding(0.1)
    // const x1 = d3.scaleBand()
    const y1 = d3.scaleLinear()
          .domain([0, d3.max(dataRebuild,(d)=>{
            return d["total"]
          })]).range([heightA - margin.top - margin.bottom, 0])

    // const y2 = d3.scaleLinear().range([heightB, 0])

    // //add Domain here
    x.domain(data.map(function(d) { 
      return d[dimension.name].value; 
    }));
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
        .text(function(d){ return d.group });

    //totals
    groupA.selectAll(".month-col")
      .data(dataRebuild)
      .append('g')
      .attr("class", "test");

      groupA.append("g")
          .attr("class", "yAxis")
          .attr("transform", "translate(" + -4 + ",0)")
          .call(d3.axisLeft(y1).tickFormat(function(d){
            return d
          }).tickSize(0).ticks(4));

      groupA.append("g")
        .attr("class", "xAxis")
          .attr("transform", "translate(" + 0 + "," + (heightA - margin.bottom - margin.top) + ")")
          .call(d3.axisBottom(x).tickFormat(function(d){
            return d
          }).tickSize(0));

      groupA.selectAll("g.yAxis g.tick")
          .append("line")
          .attr("class", "gridline")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", width)
          .attr("y2", 0);

      var color = d3.scaleOrdinal()
        .domain(dataColumns)
        .range(['#27566b','#007b82','#969FA0'])

      d3.select("#vis")
        .append("div")
        .attr("class", "tooltip")

      const tooltip = d3.select(".tooltip")
        .attr("opacity", 0)
        .style("display", "none")
        .style("background-color", "#262d33")
        .style("border-radius", "2px")
        .style("padding", "5px")
        .style("position", "absolute")
        .style("pointer-events","none")
        .html("<div id='value-body'></div>")

      var tooltipValueBody = tooltip.select("#value-body")
      var tooltipDimensionBody = tooltip.select("#dimension-body")

   // Three function that change the tooltip when user hover / move / leave a cell
      var mouseover = function(d) {
        tooltip
          .style("display", "block")
      }

      var mousemove = function(d) {
        tooltip
          .style("left", (d3.mouse(this)[0]) + "px")
          .style("top", (d3.mouse(this)[1]-25) + "px")

        // tooltipDimensionBody.html("<span>" + d.data.group + "</span>")
        let bodyString = ''
        const objs = Object.keys(d.data)
        objs.forEach((entry)=>{
            if (entry == "group") {
              bodyString = bodyString + '<p class="value-headers">' + dimension.time_interval.name[0].toUpperCase() + dimension.time_interval.name.substring(1) + ': <span class="value-headers-body">' + d.data[entry] + '</span></p>'
            }
            else if (entry == "total") {
              bodyString = bodyString + '<p class="value-headers">Shipments Available: <span class="value-headers-body">' + d.data[entry] + '</span></p>'
            } else if (entry == "price_requests.quoted_shipment_count") {
              bodyString = bodyString + '<p class="value-headers">Quoted Shipments: <span class="value-headers-body">' + (parseInt(d.data[entry]) + parseInt(d.data["asp_quotes"])) + '</span></p>'
            } else if (entry == "asp_quotes") {
              bodyString = bodyString + '<p class="value-headers">ASP Quotes: <span class="value-headers-body">' + d.data[entry] + '</span></p>'
            } 
        })
        tooltipValueBody.html(bodyString)
      }
      var mouseleave = function(d) {
        tooltip
          .style("display", "none")
      }

    const groupABars = groupA
        .selectAll(".bar-groups")
        // Enter in the stack data = loop key per key = group per group
        .data(stackedData)
        .enter().append("g")
          .attr("class", "bar-groups")
          .attr("fill", function(d) { return color(d.key); })


    groupABars
          .selectAll("rect")
          // enter a second time = loop subgroup per subgroup to add all rectangles
          .data(function(d) { return d; })
          .enter().append("rect")
            .attr("x", function(d) { return x(d.data.group); })
            .attr("y", function(d) { return y1(d[1]); })
            .attr("height", function(d) { return y1(d[0]) - y1(d[1]); })
            .attr("width",x.bandwidth())
                  .on("mouseover", mouseover)
                  .on("mousemove", mousemove)
                  .on("mouseout", mouseleave)

    groupA
        .selectAll(".bar-groups-text")
        // Enter in the stack data = loop key per key = group per group
        .data(stackedData)
        .enter().append("g")
          .attr("class", "bar-groups-text")
          .attr("pointer-events", "none")
          .selectAll("text")
          // enter a second time = loop subgroup per subgroup to add all rectangles
          .data(function(d) { return d; })
          .enter().append("text")
            .attr("x", function(d) { return x(d.data.group) + x.bandwidth()/2; })
            .attr("y", function(d) { return y1(d[0]) - 2; })
            .attr("text-anchor", "middle")
            .attr("font-size", 12)
            .attr("display", (d)=>{
              if (Math.abs(y1(d[1]) - y1(d[0])) < 12) {
                return "none"
              }
            })
            .attr("fill", "white")
            .text((d) => {
              return d[1] - d[0] 
            })
            .attr("pointer-events", "none")


      d3.selectAll(".tick text").attr("font-family", "Roboto")
        // groupA.append("text")
        //   .attr("transform", "translate(" + -24 + ",-4)")
        //   .attr("font-weight", "bold")
        //   .text("Predicted appointment - successfully scheduled | not scheduled")

      var legend = groupA.selectAll(".legend")
        .data(dataColumns)
          .enter()
            .append("g")
              .attr("class", "legend")
              .attr("transform", function(d, i) { return "translate(" + ((i * width/2.8)) + "," + (-margin.top/1.5) + ")"; });

        legend.append("circle")
            .attr("cx", 0)
            .attr("cy", 9)
            .attr("r", 7)
            .style("fill", (d,i)=>{
              return color.range()[i] 
            });

        legend.append("text")
            .attr("x", 10)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .style("font-size",10)
            .text((d,i)=>{
              const dat = ["Quoted shipments, ASP", "Quoted shipments, other", "Unquoted shipments"]
              return dat[i]
            });

    // const line2 = d3.line()
    //     .x(function(d, i) {
    //         return x0(parseDate(d.periodName));
    //     })
    //     .y(function(d, i) {
    //       const denominator = dataColumns[1] + "-" + pivotedColumns[1]
    //       const numerator = dataColumns[0] + "-" + pivotedColumns[1]
    //       return yB(d[numerator] / (d[denominator] + d[numerator]));
    //     });

    const marginB = {top: 35, right: 20, bottom: 20, left: 40}

    const y2max = d3.max([d3.max(dataRebuildLine,function(d){
        return d.wr
      })+0.05,0.1]);

    const y2 = d3.scaleLinear().range([heightB, 0]).domain([0,y2max]);


console.log(y2.domain())
    groupB.append("g")
      .attr("class", "yAxis")
      .attr("transform", "translate(" + -4 + ",0)")
      .call(d3.axisLeft(y2).tickFormat(function(d){
        return d*100 + "%"
      }).tickSize(0).ticks(2));

    groupB.selectAll("g.yAxis g.tick")
        .append("line")
        .attr("class", "gridline2")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", width)
        .attr("y2", 0);


    // groupB.append("text")
    //   .attr("transform", "translate(" + (-30) + ",-12)")
    //   .attr("text-anchor", "beginning")
    //   .attr("font-weight", "bold")
    //   .text("Conversion Rate")

    const path = groupB.append("path")
      .datum(data)
      .attr('transform', 'translate(' + ( x.bandwidth()/2 ) + ',' + 0 + ')')
      .attr("fill", "none")
      .attr("stroke", "rgba(39, 86, 107,1)")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .x(function(d) { 
          return x(d["price_requests.created_month"].value) })
        .y(function(d) { return y2(d["price_requests.win_percent"][pivotKey].value) }))

      groupB.append("text")
        .attr("x", (width - margin.left - margin.right)/1.9)
        .attr("text-anchor", "middle")
        .attr("y", -6)
        .attr("font-family", "Roboto")
        .style("font-size", 12)
        .text("Win rate")

    const dot = groupB.selectAll(".dot")
      .data(data)
      .enter().append('g')
        .attr('transform', 'translate(' + ( x.bandwidth()/2 ) + ',' + 0 + ')')
        .attr("class","dot")
        

    dot.append("circle")
        .classed('dot-boi',true).attr("r",6)
      .attr("cx", function(d){ 
        // This places the circles on the chart, using scaled x vals
        return x(d["price_requests.created_month"].value);
      })
      .attr("cy", function(d){ 
        return y2(d["price_requests.win_percent"][pivotKey].value);
      })
      .attr("fill", "rgba(39, 86, 107,1)")

    dot.append("circle")
        .classed('dot-pupil',true).attr("r",3)
      .attr("cx", function(d){ 
        // This places the circles on the chart, using scaled x vals
        return x(d["price_requests.created_month"].value);
      })
      .attr("cy", function(d){ 
        return y2(d["price_requests.win_percent"][pivotKey].value);
      })
      .attr("fill", "#e9eef0")

    dot.append("text")
      .classed("drop-shadow-text", true)
      .attr("x", function(d){ 
        // This places the circles on the chart, using scaled x vals
        return x(d["price_requests.created_month"].value);
      })
      .attr("y", function(d){ 
        return y2(d["price_requests.win_percent"][pivotKey].value) - 8;
      })
      .attr("text-anchor","middle")
      .attr("fill", "white")
      .attr("font-size", 12)
      .attr("font-weight", "bold")
      .text((d)=>{
        return Math.round(d["price_requests.win_percent"][pivotKey].value * 1000)/10 + "%"
      })

    dot.append("text")
      .attr("x", function(d){ 
        // This places the circles on the chart, using scaled x vals
        return x(d["price_requests.created_month"].value);
      })
      .attr("y", function(d){ 
        return y2(d["price_requests.win_percent"][pivotKey].value) - 8;
      })
      .attr("text-anchor","middle")
      .attr("font-size", 12)
      .attr("fill", "rgba(39, 86, 107,1)")
      .text((d)=>{
        return Math.round(d["price_requests.win_percent"][pivotKey].value * 1000)/10 + "%"
      })

    }
      
    redraw()

    // Callback at the end of the rendering to let Looker know it's finished
    done()
  }
}