import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'
import * as $ from 'jquery'

looker.plugins.visualizations.add({
    // Id and Label are legacy properties that no longer have any function besides documenting
    // what the visualization used to have. The properties are now set via the manifest
    // form within the admin/visualizations page of Looker.

    id: "sparkline-table",
    label: "ZDev Sparkline Table",
    options: {
      first_chart_data: {
          type: 'string',
          label: 'First Chart Data type',
          display: "radio",
          values: [
            {"Raw": "raw"},
            {"Percent": "percent"}
          ],
          default: "percent"
        },
        first_chart_type: {
          type: 'string',
          label: 'First Chart Type',
          display: "select",
          values: [
            {"Line": "line"},
            {"Area": "area"},
            {"Bar": "bar"}
          ],
          default: "line"
        },
        second_chart_location: {
          type: 'string',
          label: 'Second Chart Location',
          display: "select",
          values: [
            {"Sixth": "4"},
            {"Seventh": "5"},
            {"Eighth": "6"},
            {"None": "none"}
          ],
          default: "4"
        },
        second_chart_type: {
          type: 'string',
          label: 'Second Chart Type',
          display: "select",
          values: [
            {"Line": "line"},
            {"Area": "area"},
            {"Bar": "bar"}
          ],
          default: "line"
        },
        second_chart_data: {
          type: 'string',
          label: 'Second Chart Data Type',
          display: "radio",
          values: [
            {"Raw": "raw"},
            {"Percent": "percent"},
            {"None": "none"}
          ],
          default: "percent"
        },
        directionality: {
          type: 'string',
          label: 'Color negative trends',
          display: "radio",
          values: [
            {"Yes": "yes"},
            {"No": "no"}
          ],
          default: "yes"
        },
        display_values: {
          type: 'string',
          label: 'Display max/min values',
          display: "radio",
          values: [
            {"Yes": "yes"},
            {"No": "no"}
          ],
          default: "yes"
        },
        row_total: {
          type: 'string',
          label: 'Row total?',
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
             #viz-container {
              z-index: 9;
              position: relative;
              background-color: none;
              border: 1px solid #d3d3d3;
              text-align: center;
              width: 600px;
              height: 360px;
            }

            #viz {
              font-family: 'Open Sans', 'Helvetica', 'sans-serif;';
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
            </style>`;
        element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`
    },

    // Render in response to the data or settings changing
    updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
        if (environment == "prod") {
            if (!handleErrors(this, queryResponse, {
                min_pivots: 1, max_pivots: 1,
                min_dimensions: 1, max_dimensions: 10,
                min_measures: 1, max_measures: 10
            })) return
        }
    
    try {
      console.log(element, config)
      // d3.select(element).html('')
      var parseTimeDay = d3.timeParse("%Y-%m-%d");
      var parseTimeMonth = d3.timeParse("%Y-%m");

      var parseTime;

      const dimensions = queryResponse.fields.dimension_like
      const measures = queryResponse.fields.measure_like

      parseTime = parseTimeDay


      let final_dimensions = []
      let final_measures = []
      console.log("two")
      dimensions.forEach(function(entry,i){
        if (i == 2) {
          final_dimensions.push("chart_column")
          final_dimensions.push("last_week_column")
          final_dimensions.push(entry.name)
        } else if (config.second_chart_location != "none" && i == (config.second_chart_location)) {
          final_dimensions.push("second_chart_column")
          final_dimensions.push("second_last_week_column")
          final_dimensions.push(entry.name)
        } else {
          final_dimensions.push(entry.name)
        } 
      })
        if (config.second_chart_location != "none" && dimensions.length == config.second_chart_location) {
          final_dimensions.push("second_chart_column")
          final_dimensions.push("second_last_week_column")
        } 
        if (config.row_total == "yes") {
          final_dimensions.splice(2, 0, "row_total_heading");
        }
      measures.forEach(function(entry){
        final_measures.push(entry.name)
      })
console.log("three")
  const getDates = Object.keys(data[0][measures[0].name])
  const dummy = [{"date":"2022-05-02","value":0.9},{"date":"2022-05-09","value":0.9},{"date":"2022-05-16","value":0.9},{"date":"2022-05-23","value":0.9},{"date":"2022-05-30","value":0.7},{"date":"2022-06-06","value":null},{"date":"2022-06-13","value":0.9},{"date":"2022-06-20","value":0.7},{"date":"2022-06-27","value":0.9},{"date":"2022-07-04","value":0.7}]

  const w = 120
  const h = 70

  const margin = {
    top:10,
    bottom:10,
    left:0,
    right:0
  }
  const width = w - margin.left - margin.right
  const height = (h - margin.top - margin.bottom) / 2
  const x = d3.scaleTime().domain([parseTime(dummy[0].date), parseTime(dummy[dummy.length-1].date)]).range([0, width]);
  const y = d3.scaleLinear().domain([0,1]).range([height, 0]);
console.log("four")
  const line = d3.line()
      .defined(function(d) {
        return d.value != null
      })
      .x(function(d) {
        return x(parseTime(d.date));})
      .y(function(d) {
          return y(d.value);
        })

    const area = d3.area()
      .x(function(d) {
        return x(parseTime(d.date));})
      .y0(function(d) {
          return y(0);
        })
      .y1(function(d) {
          return y(d.value);
        })
   
  function createTable(data_insert,element) {
      $('#vis').contents(':not(style)').remove();
      var headings_dim = data_insert;

      var html = '<table>';
      console.log($)
      // build table headings
      html += '<thead><tr>';
      $.each(headings_dim, function () {
        console.log(this)
        let found = false
        const lookup_this = this
        // this is the current heading
        dimensions.forEach(function(entry) {
          if (lookup_this == entry.name) {
            html += '<th>' + entry.label_short + '</th>';
            found = true
          }
        })
        if (found == false) {
          if (this == "chart_column") {
            html += '<th>' + measures[0].label_short + ' Trend</th>';
          } else if (this == "second_chart_column") {
            html += '<th>' + measures[1].label_short + ' Trend</th>';
          } else if (this == "last_week_column") {
            html += '<th>' + measures[0].label_short + ' Last Period</th>';
          } else if (this == "second_last_week_column") {
            html += '<th>' + measures[1].label_short + ' Last Period</th>';
          } else if (this == "row_total_heading") {
            html += '<th>' + measures[2].label_short + '</th>';
          } else 
          {html += '<th>' + this + '</th>';}
        }
      });
      html += '</tr></thead>';


      // build table body
      html += '<tbody>';
      // use the length of first array to determine how many rows
      console.log("inside create table")
      for (let i = 0, len = data.length; i < len; i++) {
        html += '<tr>';
        // build each cell using the heading's ith element
        $.each(headings_dim, function () {
          if (this == "chart_column") {
            const chart_id = "chart_column-" + i
            
            html += '<td><div id=' + chart_id + '></div></td>';

          } else if (this == "second_chart_column") {
            const chart_id = "second_chart_column-" + i
            
            html += '<td><div id=' + chart_id + '></div></td>';

          } else if (this == "last_week_column") {
            const last_week_id = "last_week_column-" + i
            let last_week_class;
            let direction_icon;

            let date_keys = Object.keys(data[i][measures[0].name])
            date_keys = date_keys.filter((entry)=>{
              return entry[0] != "$"
            })
            let last_week_data;

            if (data[i][measures[0].name][date_keys[date_keys.length-1]]["value"] != null) {
              if (config.first_chart_data == "percent") {
                last_week_data = Math.round(data[i][measures[0].name][date_keys[date_keys.length-1]]["value"]*100,1) + "%"
              } else {
                last_week_data = data[i][measures[0].name][date_keys[date_keys.length-1]]["value"]
              }
            } else {
              last_week_data = "N/A"
            }

            // Can change this but for now, check if it's up or down from prev week

            if (data[i][measures[0].name][date_keys[date_keys.length-1]]["value"] != null && data[i][measures[0].name][date_keys[date_keys.length-2]]["value"] != null && data[i][measures[0].name][date_keys[date_keys.length-1]]["value"] < data[i][measures[0].name][date_keys[date_keys.length-2]]["value"]) {
              last_week_class = "value-down"
              direction_icon = '<div id="chart-triangle-' + i + '"></div>'
            } else if (data[i][measures[0].name][date_keys[date_keys.length-1]]["value"] != null && data[i][measures[0].name][date_keys[date_keys.length-2]]["value"] != null && data[i][measures[0].name][date_keys[date_keys.length-1]]["value"] > data[i][measures[0].name][date_keys[date_keys.length-2]]["value"]) {
              last_week_class = "value-up"
              direction_icon = '<div id="chart-triangle-' + i + '"></div>'
            } else {
              last_week_class = "value-even"
              direction_icon = '<div style="display:none" id="chart-triangle-' + i + '"></div>'
            }

            html += '<td class="triangle-flex"><div class=' + last_week_class + ' id=' + last_week_id + '><div class="change-figure">' + last_week_data + '</div>' + direction_icon + '</div></td>';

          } else if (this == "second_last_week_column") {
            const last_week_id = "second_last_week_column-" + i
            let last_week_class;
            let direction_icon;
            
            let date_keys = Object.keys(data[i][measures[1].name])
            
            date_keys = date_keys.filter((entry)=>{
              return entry[0] != "$"
            })

            let last_week_data;

            if (data[i][measures[1].name][date_keys[date_keys.length-1]]["value"] != null) {
              if (config.second_chart_data == "percent") {
                last_week_data = Math.round(data[i][measures[1].name][date_keys[date_keys.length-1]]["value"]*100,1) + "%"
              } else {
                last_week_data = data[i][measures[1].name][date_keys[date_keys.length-1]]["value"]
              }
            } else {
              last_week_data = "N/A"
            }

            // Can change this but for now, check if it's up or down from prev week

            if (data[i][measures[1].name][date_keys[date_keys.length-1]]["value"] != null && data[i][measures[1].name][date_keys[date_keys.length-2]]["value"] != null && data[i][measures[1].name][date_keys[date_keys.length-1]]["value"] < data[i][measures[1].name][date_keys[date_keys.length-2]]["value"]) {
              last_week_class = "value-down"
              direction_icon = '<div id="second-chart-triangle-' + i + '"></div>'
            } else if (data[i][measures[1].name][date_keys[date_keys.length-1]]["value"] != null && data[i][measures[1].name][date_keys[date_keys.length-2]]["value"] != null && data[i][measures[1].name][date_keys[date_keys.length-1]]["value"] > data[i][measures[1].name][date_keys[date_keys.length-2]]["value"]) {
              last_week_class = "value-up"
              direction_icon = '<div id="second-chart-triangle-' + i + '"></div>'
            } else {
              last_week_class = "value-even"
              direction_icon = '<div style="display:none" id="second-chart-triangle-' + i + '"></div>'
            }

            html += '<td class="triangle-flex"><div class=' + last_week_class + ' id=' + last_week_id + '><div class="change-figure">' + last_week_data + '</div>' + direction_icon + '</div></td>';

          } else if (this == "row_total_heading") {
            if (config.second_chart_location == "none") {
              html += '<td>' + data[i][measures[measures.length - 2]["name"]]["$$$_row_total_$$$"]["value"] + '</td>'; 
            } else {
              html += '<td>' + data[i][measures[measures.length - 1]["name"]]["$$$_row_total_$$$"]["value"] + '</td>'; 
            }            
          } else {
            if (data[i][this]["rendered"]) {
              html += '<td>' + data[i][this]["rendered"] + '</td>';
            } else {
              html += '<td>' + data[i][this]["value"] + '</td>';
            }
          }
          
        });
        html += '</tr>';
      }
      html += '</tbody>';
      html += '</table>';
      $('#vis').append(html);
    }

    function drawOnTable(data_insert,element) {
        console.log("inside drawOnTable")
      for (let i = 0, len = data.length; i < len; i++) {
        let dataset_one = []

        let dataset_one_keys = Object.keys(data[i][measures[0].name])
        dataset_one_keys.forEach((entry)=>{
          if (entry[0] != "$") {
            dataset_one.push({date:entry,value:data[i][measures[0].name][entry]["value"]})
          }
          
        })

        const chart_id_grabber = "#chart_column-" + i
        const triangle_id_grabber = "#chart-triangle-" + i

        const svg = d3.select(chart_id_grabber).append('svg')
                .html('')
                .attr('width', width)
                .attr('height', height)
                .classed('first-svg', true)

        const group = svg.append('g')
              .attr("transform", "translate(" + margin.left + "," + 15 + ")")
              .attr("width", "100%")
              .attr("height", "100%")
                  .classed("group", true)

        var icons = d3.select(triangle_id_grabber).append("svg")
          .attr("width", 30)
          .attr("height", 30)
          .append("g")
            .attr("transform",  "translate(15,18)")

        const tri = icons
          .append('path')
          .attr("d", d3.symbol().type(d3.symbolTriangle).size(30))

        if (dataset_one[dataset_one.length-1].value < dataset_one[dataset_one.length-2].value) {
          tri.attr("transform",  "rotate(180)")
          .style("fill", "#D76106");
        } else {
          tri
            .style("fill", "#0072b5");
        }


        if (config.first_chart_type == "line") {
          group.append("path")
              .data([dataset_one])
              .attr("class", "line")
              .attr("d", line)
              .attr("stroke", (d)=>{
                if (config.directionality == "yes") {
                  if (dataset_one[dataset_one.length-1].value != null && dataset_one[0].value > dataset_one[dataset_one.length-1].value) {
                    return "#D76106"
                  } else {
                    return "#0072b5"
                  }
                } else {
                  return ["#27566b","#007b82"][i%2]
                }
              });
            } else if (config.first_chart_type == "area") {
              group.append("path")
              .data([dataset_one])
              .attr("class", "area")
              .attr("d", area)
              .attr("stroke", (d)=>{
                if (config.directionality == "yes") {
                  if (dataset_one[dataset_one.length-1].value != null && dataset_one[0].value > dataset_one[dataset_one.length-1].value) {
                    return "#D76106"
                  } else {
                    return "#0072b5"
                  }
                } else {
                  return ["#27566b","#007b82"][i%2]
                }
              })
              .attr("fill", (d)=>{
                if (config.directionality == "yes") {
                  if (dataset_one[dataset_one.length-1].value != null && dataset_one[0].value > dataset_one[dataset_one.length-1].value) {
                    return "#D76106"
                  } else {
                    return "#0072b5"
                  }
                } else {
                  return ["#27566b","#007b82"][i%2]
                }
              });
            } else if (config.first_chart_type == "bar") {
              
              const xBar = d3.scaleBand().domain(dataset_one.map(function(d,i){
                return d.date
              })).range([0, width]).padding(0.05);

              group.selectAll(".bar")
                .data(dataset_one)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", (d)=>{
                  return xBar(d.date)
                })
                .attr("y", (d)=>{
                  return y(d.value)
                })
                .attr("width", xBar.bandwidth())
                .attr("height", (d)=>{ 
                  return height - y(d.value) })
                .attr("fill", (d)=>{
                  if (config.directionality == "yes") {
                    if (dataset_one[dataset_one.length-1].value != null && dataset_one[0].value > dataset_one[dataset_one.length-1].value) {
                      return "#D76106"
                    } else {
                      return "#0072b5"
                    }
                  } else {
                    return ["#27566b","#007b82"][i%2]
                  }
                });
            }
        

       let arr_text = []

       const val_extent = d3.extent(dataset_one,function(d,i){
          return d.value
       })

       let maxValPlace; 
       let minValPlace; 
console.log("six")
       dataset_one.forEach(function(entry,i) {
         if (entry.value == val_extent[1]) {
          maxValPlace = entry.date
         } else if (entry.value == val_extent[0]) {
          minValPlace = entry.date
         }
       })
       if (isNaN(+val_extent[0])) {
        console.log("No max/min")
       } else {
        arr_text.push({"value":val_extent[1],"date":maxValPlace})
       arr_text.push({"value":val_extent[0],"date":minValPlace})

       if (config.display_values == "yes") {
         var filter = group.append("defs")
            .append("filter")
            .attr("id", "blur")
            .append("feGaussianBlur")
            .attr("stdDeviation", .5); 

        group.selectAll(".min-max-text-background")
              .data(arr_text)
              .enter()
              .append("text")
              .attr("class", "min-max-text-background")
              .attr("x", (d,i)=>{
                return x(parseTime(d.date))
              })
              .attr("y", (d,i)=>{
                if (i == 1) {
                  return y(d.value) + 10 
                } else {
                  return y(d.value) - 4
                }
                
              })
              .text((d)=>{
                if (config.first_chart_data == "percent") {
                  return Math.round((d.value * 100),1) + "%"
                } else {
                  return d.value
                }
              })
              .attr("font-size", 8)
              .attr("font-weight", 500)
              .attr("fill", "white")
              .attr("text-anchor",(d,i)=>{
                if (x(parseTime(d.date))<30) {
                  return "beginning"
                } else {
                  return "end"
                }
                
              })
              .attr("filter", "url(#blur)")
console.log("seven")
         group.selectAll(".min-max-text")
              .data(arr_text)
              .enter()
              .append("text")
              .attr("class", "min-max-text")
              .attr("x", (d,i)=>{
                return x(parseTime(d.date))
              })
              .attr("y", (d,i)=>{
                if (i == 1) {
                  return y(d.value) + 10 
                } else {
                  return y(d.value) - 4
                }
                
              })
              .text((d)=>{
                if (config.first_chart_data == "percent") {
                  return Math.round((d.value * 100),1) + "%"
                } else {
                  return d.value
                }
              })
              .attr("font-size", 8)
              .attr("font-weight", 500)
              .attr("text-anchor",(d,i)=>{
                if (x(parseTime(d.date))<30) {
                  return "beginning"
                } else {
                  return "end"
                }
                
              })
          }
       
       }
        
        if (config.second_chart_location != "none") {
          let dataset_two = []

        let dataset_two_keys = Object.keys(data[i][measures[1].name])
        dataset_two_keys.forEach((entry)=>{
          if (entry[0] != "$") {
            dataset_two.push({date:entry,value:data[i][measures[1].name][entry]["value"]})
          }
        })

        const second_chart_id_grabber = "#second_chart_column-" + i
        const second_triangle_id_grabber = "#second-chart-triangle-" + i

        const svg_two = d3.select(second_chart_id_grabber).append('svg')
                .html('')
                .attr('width', width)
                .attr('height', height)
                .classed('second-svg', true)

        const group_two = svg_two.append('g')
              .attr("transform", "translate(" + margin.left + "," + 15 + ")")
              .attr("width", "100%")
              .attr("height", "100%")
                  .classed("group_two", true)

        var icons_two = d3.select(second_triangle_id_grabber).append("svg")
          .attr("width", 30)
          .attr("height", 30)
          .append("g")
            .attr("transform",  "translate(15,18)")

        const tri_two = icons_two
          .append('path')
          .attr("d", d3.symbol().type(d3.symbolTriangle).size(30))

        if (dataset_two[dataset_two.length-1].value < dataset_two[dataset_two.length-2].value) {
          tri_two.attr("transform",  "rotate(180)")
          .style("fill", "#D76106");
        } else {
          tri_two
            .style("fill", "#0072b5");
        }


        if (config.second_chart_type == "line") {
          group_two.append("path")
              .data([dataset_two])
              .attr("class", "line")
              .attr("d", line)
              .attr("stroke", (d)=>{
                if (config.directionality == "yes") {
                  if (dataset_two[dataset_two.length-1].value != null && dataset_two[0].value > dataset_two[dataset_two.length-1].value) {
                    return "#D76106"
                  } else {
                    return "#0072b5"
                  }
                } else {
                  return ["#27566b","#007b82"][i%2]
                }
              });
            } else if (config.second_chart_type == "area") {
              group_two.append("path")
              .data([dataset_two])
              .attr("class", "area")
              .attr("d", area)
              .attr("stroke", (d)=>{
                if (config.directionality == "yes") {
                  if (dataset_two[dataset_two.length-1].value != null && dataset_two[0].value > dataset_two[dataset_two.length-1].value) {
                    return "#D76106"
                  } else {
                    return "#0072b5"
                  }
                } else {
                  return ["#27566b","#007b82"][i%2]
                }
              })
              .attr("fill", (d)=>{
                if (config.directionality == "yes") {
                  if (dataset_two[dataset_two.length-1].value != null && dataset_two[0].value > dataset_two[dataset_two.length-1].value) {
                    return "#D76106"
                  } else {
                    return "#0072b5"
                  }
                } else {
                  return ["#27566b","#007b82"][i%2]
                }
              });
            } else if (config.second_chart_type == "bar") {
              
              const xBar = d3.scaleBand().domain(dataset_two.map(function(d,i){
                return d.date
              })).range([0, width]).padding(0.05);

              group_two.selectAll(".bar")
                .data(dataset_two)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", (d)=>{
                  return xBar(d.date)
                })
                .attr("y", (d)=>{
                  return y(d.value)
                })
                .attr("width", xBar.bandwidth())
                .attr("height", (d)=>{ 
                  return height - y(d.value) })
                .attr("fill", (d)=>{
                  if (config.directionality == "yes") {
                    if (dataset_two[dataset_two.length-1].value != null && dataset_two[0].value > dataset_two[dataset_two.length-1].value) {
                      return "#D76106"
                    } else {
                      return "#0072b5"
                    }
                  } else {
                    return ["#27566b","#007b82"][i%2]
                  }
                });
            }
        

       let arr_text_two = []

       const val_extent_two = d3.extent(dataset_two,function(d,i){
          return d.value
       })

       let maxValPlace_two; 
       let minValPlace_two; 

       dataset_two.forEach(function(entry,i) {
         if (entry.value == val_extent_two[1]) {
          maxValPlace_two = entry.date
         } else if (entry.value == val_extent_two[0]) {
          minValPlace_two = entry.date
         }
       })
       if (isNaN(+val_extent_two[0])) {
        console.log("")
       } else {
        arr_text_two.push({"value":val_extent_two[1],"date":maxValPlace_two})
        arr_text_two.push({"value":val_extent_two[0],"date":minValPlace_two})

       if (config.display_values == "yes") {
         var filter_two = group_two.append("defs")
            .append("filter")
            .attr("id", "blur_two")
            .append("feGaussianBlur")
            .attr("stdDeviation", .5); 

        group_two.selectAll(".min-max-text-background_two")
              .data(arr_text_two)
              .enter()
              .append("text")
              .attr("class", "min-max-text-background_two")
              .attr("x", (d,i)=>{
                return x(parseTime(d.date))
              })
              .attr("y", (d,i)=>{
                if (i == 1) {
                  return y(d.value) + 10 
                } else {
                  return y(d.value) - 4
                }
                
              })
              .text((d)=>{
                if (config.second_chart_data == "percent") {
                  return Math.round((d.value * 100),1) + "%"
                } else {
                  return d.value
                }
              })
              .attr("font-size", 8)
              .attr("font-weight", 500)
              .attr("fill", "white")
              .attr("text-anchor",(d,i)=>{
                if (x(parseTime(d.date))<30) {
                  return "beginning"
                } else {
                  return "end"
                }
                
              })
              .attr("filter", "url(#blur_two)")

         group_two.selectAll(".min-max-text_two")
              .data(arr_text_two)
              .enter()
              .append("text")
              .attr("class", "min-max-text_two")
              .attr("x", (d,i)=>{
                return x(parseTime(d.date))
              })
              .attr("y", (d,i)=>{
                if (i == 1) {
                  return y(d.value) + 10 
                } else {
                  return y(d.value) - 4
                }
                
              })
              .text((d)=>{
                if (config.second_chart_data == "percent") {
                  return Math.round((d.value * 100),1) + "%"
                } else {
                  return d.value
                }
              })
              .attr("font-size", 8)
              .attr("font-weight", 500)
              .attr("text-anchor",(d,i)=>{
                if (x(parseTime(d.date))<30) {
                  return "beginning"
                } else {
                  return "end"
                }
                
              })
          }
       
       }

          // End of second column charting
        }

      }
    }
      createTable(final_dimensions)

      drawOnTable(final_dimensions)
 
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
})