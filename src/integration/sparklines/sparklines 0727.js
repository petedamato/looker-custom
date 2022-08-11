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

        first_chart_type: {
          section: 'Setup',
          order:3,
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
        second_chart_type: {
          section: 'Setup',
          order:4,
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
        where_values: {
          section: "Setup",
          order: 1,
          type: "string",
          display: "text",
          label: "Measure(s) to draw from (see docs)",
          placeholder: "Comma separated",
          default:""
        },
        where_chart: {
          section: "Setup",
          order:2,
          type: "string",
          display: "text",
          label: "Chart column(s) placement (see docs)",
          placeholder: "Comma separated",
          default:""
        },
        y_axis_lower_first: {
          section: "Y",
          order:1,
          type: "string",
          display: "text",
          label: "Lower Y-Axis Bound",
          placeholder: "Set lower y-axis bound",
          default: ""
        },
        y_axis_upper_first: {
          section: "Y",
          order:2,
          type: "string",
          display: "text",
          label: "Upper Y-Axis Bound",
          placeholder: "Set upper y-axis bound",
          default: ""
        },
        y_axis_lower_second: {
          section: "Y",
          order:3,
          type: "string",
          display: "text",
          label: "Lower Y-Axis Bound (Second Chart)",
          placeholder: "Set lower y-axis bound",
          default: ""
        },
        y_axis_upper_second: {
          section: "Y",
          order:4,
          type: "string",
          display: "text",
          label: "Upper Y-Axis Bound (Second Chart)",
          placeholder: "Set upper y-axis bound",
          default: ""
        },
        directionality: {
          section: 'Formatting',
          order:4,
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
          section: 'Formatting',
          order:3,
          type: 'string',
          label: 'Display max/min values',
          display: "radio",
          values: [
            {"Yes": "yes"},
            {"No": "no"}
          ],
          default: "yes"
        },
        change_label_second: {
          section: 'Labels',
          order:4,
          type: 'string',
          label: 'Change column 2 label',
          display: "text",
          default: ""
        },
        change_label_first: {
          section: 'Labels',
          order:2,
          type: 'string',
          label: 'Change column 1 label',
          display: "text",
          default: ""
        },
        label_first: {
          section: 'Labels',
          order:1,
          type: 'string',
          label: 'Chart column 1 label',
          display: "text",
          default: ""
        },
        label_second: {
          section: 'Labels',
          order:3,
          type: 'string',
          label: 'Chart column 2 label',
          display: "text",
          default: ""
        },
        freeze_header: {
          section: 'Formatting',
          order:1,
          type: 'boolean',
          label: 'Freeze header row',
          default: true
        }
      },

    // Set up the initial state of the visualization
    create: function(element, config) {
        // Insert a <style> tag with some styles we'll use later
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
              body {
                  font-family: Roboto;
                  font-size: 12px;
              }
            .error-container {
                margin: 0;
                position: absolute;
                top: 50%;
                -ms-transform: translateY(-50%);
                transform: translateY(-50%);
                text-align:center;
                width:100%;
            }
            .error {
              font-family:Roboto;
              font-size:16px
            }
            .error-header {
              font-family:Roboto;
              font-weight:700;
              font-size:16px
            }
            .min-max-text-background {
              font-weight:700!important;
              font-family:Roboto;
            }
            .min-max-text-background_two {
              font-weight:700!important;
              font-family:Roboto;
            }
             .min-max-text {
              font-weight:700!important;
              font-family:Roboto;
            }
            .min-max-text_two {
              font-weight:700!important;
              font-family:Roboto;
            }
            .line {
              fill: none;
              stroke-width: 2px;
            }
            .null-val {
                color:#c2c2c2;
              }
                        /* design */
            table {
                border-collapse:collapse;
                border:none;
               overflow-y:scroll;
               height:100%;
               font-size: 12px;
               display:block;
               text-align:left;
           }
            table td, table th {
                border: 1px solid #bec4c7;
            }
            th {
              padding: 8px 8px;
              background-color:#c2d3e0;
              font-family:Roboto;
              font-size:12px!important;
              font-weight:500;
            }
            th.stuck {
              position: sticky!important;
              top:0;
            }
            td {
              font-family:Roboto;
              font-size:12px!important;
              font-weight:400!important;
            }
            .table-index {
              text-align: right;
            }
            .chart_column {
                min-width: 120px!important;
                min-height: 70px!important;
                text-align:center;
            }
            .second_chart_column {
                min-width: 120px!important;
                min-height: 70px!important;
                text-align:center;
            }
            tr:nth-child(even) { background: #f0f1f0; }
              .value-down {
                color: #D76106;
                font-weight:500;
                display:flex;
                justify-content: center;
              }
              td:not(.no-padding) {
                padding: 0 8px;
              }
              .value-even {
                text-align:center;
              }
              .value-up {
                color: #0072b5;
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
            .insert-column {
              background-color:#9facb7;
            }
            </style>`;
        element.style.fontFamily = `Roboto,"Open Sans", "Helvetica", sans-serif`
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
    if (config.where_values.split(",") && config.where_values.split(",").length > 2) {
      $('#vis').contents(':not(style)').remove();
      const error = '<div class="error-container"><div class="error-header">Too many charted measures</div><div class="error">Sparklines cannot currently handle more than two chart columns.</div></div>'
      $('#vis').append(error);
    } else if (config.where_values.split(",") && config.where_chart.split(",").length != config.where_values.split(",").length) {
      $('#vis').contents(':not(style)').remove();
      const error = '<div class="error-container"><div class="error-header">Options mismatch</div><div class="error">Number of measures charted and chart columns must be equal.</div></div>'
      $('#vis').append(error);
    } else if (config.where_values.split(",") && parseInt(config.where_values.split(",")[0]) > queryResponse.fields.measure_like.length - 1 || parseInt(config.where_values.split(",")[1]) > queryResponse.fields.measure_like.length - 1 || parseInt(config.where_values.split(",")[2]) > queryResponse.fields.measure_like.length - 1 ) {
      $('#vis').contents(':not(style)').remove();
      const error = '<div class="error-container"><div class="error-header">Index out of range</div><div class="error">That value is out of the range of possible measures.</div></div>'
      $('#vis').append(error);
    } else {

    try {
      // d3.select(element).html('')
      var parseTimeDay = d3.timeParse("%Y-%m-%d");
      var parseTimeMonth = d3.timeParse("%Y-%m");

      var parseTime;

      const dimensions = queryResponse.fields.dimension_like;
      const measures = queryResponse.fields.measure_like;
      const pivots = queryResponse.fields.pivots;

      parseTime = parseTimeDay;

      let where_chart = []; 

      if (config.where_chart.length < 1) {
        where_chart = []
      } else if (config.where_chart.split(",").length == 1 || config.where_chart.split(",")[1] == '') {
        where_chart[0] = parseInt(config.where_chart[0])
      } else {
        where_chart[0] = parseInt(config.where_chart.split(",")[0])
        where_chart[1] = parseInt(config.where_chart.split(",")[1])
      }

      let where_values = []; 

      if (config.where_values.length < 1) {
        where_values = []
      } else if (config.where_values.split(",").length == 1 || config.where_values.split(",")[1] == '') {
        where_values[0] = parseInt(config.where_values[0])
      } else {
        where_values[0] = parseInt(config.where_values.split(",")[0])
        where_values[1] = parseInt(config.where_values.split(",")[1])
      }
      
      let row_totals = [];

      let final_dimensions = [];
      let final_measures = [];

      let measures_start = dimensions.length - 1; 

      dimensions.forEach(function(entry,i){
        final_dimensions.push(entry.name)
      })

      if (where_values.length < measures.length) {
        measures.forEach(function(entry,i) {
          if (where_values.includes(i)) {
            return
          } else {
            row_totals.push(entry.name)
            final_dimensions.push(("row_total_heading-" + i));
          }
        })
      }

      if (where_chart.length > 1) {
        final_dimensions.splice(where_chart[1],0,"second_last_week_column")
        final_dimensions.splice(where_chart[1],0,"second_chart_column")
      }
      if (where_chart.length > 0) {
        final_dimensions.splice(where_chart[0],0,"last_week_column")
        final_dimensions.splice(where_chart[0],0,"chart_column")
      }

      measures.forEach(function(entry){
        final_measures.push(entry.name)
      })

  // TODO error reporting
  // TODO responsive widths
  const w = 120
  const h = 70

  const margin = {
    top:16,
    bottom:16,
    left:0,
    right:0
  }
  const width = w - margin.left - margin.right
  const height = (h - margin.top - margin.bottom) / 2
  const x = d3.scaleTime().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);
  const y2 = d3.scaleLinear().range([height, 0]);

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
      // Clear out the previous charts/code if not removed to see the table
      $('#vis').contents(':not(style)').remove();
      var headings_dim = data_insert;

      var html = '<table>';

      html += '<thead><tr><th class="table-index"></th>';
      $.each(headings_dim, function () {
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
            if (config.label_first.length == 0) {
            html += '<th class="insert-column">' + measures[where_values[0]].label_short + ' Trend</th>';
            } else 
            {html += '<th class="insert-column">' + config.label_first + '</th>';}
          } else if (this == "second_chart_column") {
            if (config.label_second.length == 0) {
            html += '<th class="insert-column">' + measures[where_values[1]].label_short + ' Trend</th>';}
            else {
              html += '<th class="insert-column">' + config.label_second + '</th>';
            }
          } else if (this == "last_week_column") {
            if (config.change_label_first.length == 0) {
            html += '<th class="insert-column">' + measures[where_values[0]].label_short + ' Last Period</th>';}
            else {
              html += '<th class="insert-column">' + config.change_label_first + '</th>';
            }
          } else if (this == "second_last_week_column") {
            if (config.change_label_second.length == 0) {
            html += '<th class="insert-column">' + measures[where_values[1]].label_short + ' Last Period</th>';}
            else {
              html += '<th class="insert-column">' + config.change_label_second + '</th>';
            }
          } else if (this.split("-")[0] == "row_total_heading") {
            html += '<th>' + measures[this.split("-")[1]].label_short + '</th>';
          } else 
          {html += '<th>' + this + '</th>';}
        }
      });
      html += '</tr></thead>';

      // build table body
      html += '<tbody>';
      // use the length of first array to determine how many rows
      for (let i = 0, len = data.length; i < len; i++) {
        html += '<tr><td class="table-index">' + (i + 1) + '</td>';
        // build each cell using the heading's ith element
        $.each(headings_dim, function () {
          if (this == "chart_column") {
            const chart_id = "chart_column-" + i
            
            html += '<td class="no-padding"><div class="chart_column" id=' + chart_id + '></div></td>';

          } else if (this == "second_chart_column") {
            const chart_id = "second_chart_column-" + i
            
            html += '<td class="no-padding"><div class="second_chart_column" id=' + chart_id + '></div></td>';

          } else if (this == "last_week_column") {
            const last_week_id = "last_week_column-" + i
            let last_week_class;
            let direction_icon;

            let date_keys = Object.keys(data[i][measures[where_values[0]].name])
            date_keys = date_keys.filter((entry)=>{
              return entry[0] != "$"
            })
            let last_week_data;

            if (data[i][measures[where_values[0]].name][date_keys[date_keys.length-1]]["value"] != null) {

                last_week_data = data[i][measures[where_values[0]].name][date_keys[date_keys.length-1]]["rendered"]

            } else {
              last_week_data = "<span class='null-val'>∅</span>"
            }

            // Can change this but for now, check if it's up or down from prev week

            if (data[i][measures[where_values[0]].name][date_keys[date_keys.length-1]]["value"] != null && data[i][measures[where_values[0]].name][date_keys[date_keys.length-2]]["value"] != null && data[i][measures[where_values[0]].name][date_keys[date_keys.length-1]]["value"] < data[i][measures[where_values[0]].name][date_keys[date_keys.length-2]]["value"]) {
              last_week_class = "value-down"
              direction_icon = '<div id="chart-triangle-' + i + '"></div>'
            } else if (data[i][measures[where_values[0]].name][date_keys[date_keys.length-1]]["value"] != null && data[i][measures[where_values[0]].name][date_keys[date_keys.length-2]]["value"] != null && data[i][measures[where_values[0]].name][date_keys[date_keys.length-1]]["value"] > data[i][measures[where_values[0]].name][date_keys[date_keys.length-2]]["value"]) {
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
            
            let date_keys = Object.keys(data[i][measures[where_values[1]].name])
            
            date_keys = date_keys.filter((entry)=>{
              return entry[0] != "$"
            })

            let last_week_data;

            if (data[i][measures[where_values[1]].name][date_keys[date_keys.length-1]]["value"] != null) {
                last_week_data = data[i][measures[where_values[1]].name][date_keys[date_keys.length-1]]["rendered"]
            } else {
              last_week_data = "<span class='null-val'>∅</span>"
            }

            // Can change this but for now, check if it's up or down from prev week
            if (data[i][measures[where_values[1]].name][date_keys[date_keys.length-1]]["value"] != null && data[i][measures[where_values[1]].name][date_keys[date_keys.length-2]]["value"] != null && data[i][measures[where_values[1]].name][date_keys[date_keys.length-1]]["value"] < data[i][measures[where_values[1]].name][date_keys[date_keys.length-2]]["value"]) {
              last_week_class = "value-down"
              direction_icon = '<div id="second-chart-triangle-' + i + '"></div>'
            } else if (data[i][measures[where_values[1]].name][date_keys[date_keys.length-1]]["value"] != null && data[i][measures[where_values[1]].name][date_keys[date_keys.length-2]]["value"] != null && data[i][measures[where_values[1]].name][date_keys[date_keys.length-1]]["value"] > data[i][measures[where_values[1]].name][date_keys[date_keys.length-2]]["value"]) {
              last_week_class = "value-up"
              direction_icon = '<div id="second-chart-triangle-' + i + '"></div>'
            } else {
              last_week_class = "value-even"
              direction_icon = '<div style="display:none" id="second-chart-triangle-' + i + '"></div>'
            }

            html += '<td class="triangle-flex"><div class=' + last_week_class + ' id=' + last_week_id + '><div class="change-figure">' + last_week_data + '</div>' + direction_icon + '</div></td>';

          } else if (this.split("-")[0] == "row_total_heading") {
            if (data[i][measures[this.split("-")[1]]["name"]]["$$$_row_total_$$$"]["value"]) {
              if (data[i][measures[this.split("-")[1]]["name"]]["$$$_row_total_$$$"]["rendered"]) {
                html += '<td class="value-even">' + data[i][measures[this.split("-")[1]]["name"]]["$$$_row_total_$$$"]["rendered"] + '</td>';
              } else {
                html += '<td class="value-even">' + data[i][measures[this.split("-")[1]]["name"]]["$$$_row_total_$$$"]["value"] + '</td>';
              }
            } else {
              console.log(this, " has no values to display")
            }
            
          } else {
            if (data[i][this]["rendered"]) {
              html += '<td>' + data[i][this]["rendered"] + '</td>';
            } else if (data[i][this]["value"] == null) {
              html += '<td>' + "<i>null</i>" + '</td>';
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

      if (config.freeze_header == true) {
        $('th').addClass('stuck')
      } else {
        $('th').removeClass('stuck')
      }
    }

    function drawOnTable(data_insert,element) {
      // Find extent for all charted values
      let width_first;
      let height_first;
      if (config.where_chart.length > 0){ 
        const node_get_width = d3.select("#chart_column-0")
        const new_node_width = node_get_width.select(function() { return this.parentNode; })
        width_first = new_node_width.node().getBoundingClientRect().width
      } 

      if (config.where_chart.length > 0){ 
        const node_get_height = d3.select("#chart_column-0")
        const new_node_height = node_get_height.select(function() { return this.parentNode; })
        height_first = new_node_height.node().getBoundingClientRect().height
      } 

      let width_second;
      let height_second;
      if (config.where_chart.length > 1){ 
        const node_get_width_2 = d3.select("#second_chart_column-0")
        const new_node_width_2 = node_get_width_2.select(function() { return this.parentNode; })
        width_second = new_node_width_2.node().getBoundingClientRect().width

      } 
      if (config.where_chart.length > 1){ 
        const node_get_height_2 = d3.select("#second_chart_column-0")
        const new_node_height_2 = node_get_height_2.select(function() { return this.parentNode; })
        height_second = new_node_height_2.node().getBoundingClientRect().height
      } 

      let col_one_max
      let col_one_min
      let col_two_max
      let col_two_min
      if (where_values.length < 1) {
        return
      } else {
      for (let j = 0, len = data.length; j < len; j++) {
        let dataset_one = []

        let dataset_one_keys = Object.keys(data[j][measures[where_values[0]].name])
        dataset_one_keys.forEach((entry)=>{
          if (entry[0] != "$") {
            dataset_one.push({date:entry,value:data[j][measures[where_values[0]].name][entry]["value"]})
          }
          
        })
        col_one_max = d3.max([col_one_max,d3.max(dataset_one,(ent)=>{
          return ent.value
        })])
        col_one_min = d3.min([col_one_min,d3.min(dataset_one,(ent)=>{
          return ent.value
        })])

        if (where_values.length > 1) {
          let dataset_two = []

          let dataset_two_keys = Object.keys(data[j][measures[where_values[1]].name])
          dataset_two_keys.forEach((entry)=>{
            if (entry[0] != "$") {
              dataset_two.push({date:entry,value:data[j][measures[where_values[1]].name][entry]["value"]})
            }
            
          })
          col_two_max = d3.max([col_two_max,d3.max(dataset_two,(ent)=>{
            return ent.value
          })])
          col_two_min = d3.min([col_two_min,d3.min(dataset_two,(ent)=>{
            return ent.value
          })])
        }
      }

      for (let i = 0, len = data.length; i < len; i++) {
        let dataset_one = []

        let dataset_one_keys = Object.keys(data[i][measures[where_values[0]].name])
        dataset_one_keys.forEach((entry)=>{
          if (entry[0] != "$") {
            dataset_one.push({date:entry,value:data[i][measures[where_values[0]].name][entry]["value"],rendered:data[i][measures[where_values[0]].name][entry]["rendered"]})
          }
          
        })

        if (config.y_axis_lower_first == "" && config.y_axis_upper_first == "" ) {
          y.domain([col_one_min,col_one_max])
        } else if (config.y_axis_lower_first != "" && config.y_axis_upper_first != "" ) {
          y.domain([config.y_axis_lower_first,config.y_axis_upper_first])
        } else if (config.y_axis_lower_first != "") {
          y.domain([config.y_axis_lower_first,col_one_max])
        } else {
          y.domain([col_one_min,config.y_axis_upper_first])
        }
  
        x.domain([parseTime(dataset_one[0].date), parseTime(dataset_one[dataset_one.length-1].date)]).range([0,width_first - margin.left - margin.right])
        y.range([height_first - margin.top - margin.bottom,0])

        const chart_id_grabber = "#chart_column-" + i
        const triangle_id_grabber = "#chart-triangle-" + i

        const svg = d3.select(chart_id_grabber).append('svg')
                .html('')
                .attr('width', width_first)
                .attr('height', height_first)
                .classed('first-svg', true)

        const group = svg.append('g')
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
              .attr("width", width_first - margin.left - margin.right)
              .attr("height", height_first - margin.top - margin.bottom)
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
              })).range([0,width_first - margin.left - margin.right]).padding(0.05);

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
                  return height_first - y(d.value) })
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

       let maxValValues = {}; 
       let minValValues = {}; 

       dataset_one.forEach(function(entry,i) {
         if (entry.value == val_extent[1]) {
          maxValValues["date"] = entry.date
          maxValValues["rendered"] = entry.rendered
         } else if (entry.value == val_extent[0]) {
          minValValues["date"] = entry.date
          minValValues["rendered"] = entry.rendered
         }
       })
       if (isNaN(+val_extent[0])) {
        console.log("No max/min")
       } else {
        arr_text.push({"value":val_extent[1],"date":maxValValues["date"],"rendered":maxValValues["rendered"]})
        arr_text.push({"value":val_extent[0],"date":minValValues["date"],"rendered":minValValues["rendered"]})

       if (config.display_values == "yes") {
         var filter = group.append("defs")
            .append("filter")
            .attr("id", "blur")
            .append("feGaussianBlur")
            .attr("stdDeviation", .8); 

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
                return d.rendered
              })
              .attr("font-size", 8)
              .attr("font-family", "Roboto")
              .attr("font-weight", 700)
              .attr("fill", "white")
              .attr("text-anchor",(d,i)=>{
                if (x(parseTime(d.date))<30) {
                  return "beginning"
                } else {
                  return "end"
                }
                
              })
              .style("opacity", .4)
              .attr("filter", "url(#blur)")

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
                return d.rendered
              })
              .attr("font-size", 8)
              .attr("font-weight", 700)
              .attr("text-anchor",(d,i)=>{
                if (x(parseTime(d.date))<30) {
                  return "beginning"
                } else {
                  return "end"
                }
                
              })
          }
       
       }
        
        if (where_values.length > 1 ) {




        let dataset_two = []

        let dataset_two_keys = Object.keys(data[i][measures[where_values[1]].name])
        dataset_two_keys.forEach((entry)=>{
          if (entry[0] != "$") {
            dataset_two.push({date:entry,value:data[i][measures[where_values[1]].name][entry]["value"],rendered:data[i][measures[where_values[1]].name][entry]["rendered"]})
          }
        })
            if (config.y_axis_lower_second == "" && config.y_axis_upper_second == "" ) {
              y2.domain([col_two_min,col_two_max])
            } else if (config.y_axis_lower_second != "" && config.y_axis_upper_second != "" ) {
              y2.domain([config.y_axis_lower_second,config.y_axis_upper_second])
            } else if (config.y_axis_lower_second != "") {
              y2.domain([config.y_axis_lower_second,col_two_max])
            } else {
              y2.domain([col_two_min,config.y_axis_upper_second])
            }
        x.domain([parseTime(dataset_two[0].date), parseTime(dataset_two[dataset_two.length-1].date)]).range([0,width_first - margin.left - margin.right])
        y2.range([height_first - margin.top - margin.bottom,0])
      const line2 = d3.line()
          .defined(function(d) {
            return d.value != null
          })
          .x(function(d) {
            return x(parseTime(d.date));})
          .y(function(d) {
              return y2(d.value);
            })

      const area2 = d3.area()
          .x(function(d) {
            return x(parseTime(d.date));})
          .y0(function(d) {
              return y2(0);
            })
          .y1(function(d) {
              return y2(d.value);
            })
        const second_chart_id_grabber = "#second_chart_column-" + i
        const second_triangle_id_grabber = "#second-chart-triangle-" + i

        const svg_two = d3.select(second_chart_id_grabber).append('svg')
                .html('')
                .attr('width', width_second)
                .attr('height', height_second)
                .classed('second-svg', true)

        const group_two = svg_two.append('g')
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
              .attr("width", width_second - margin.left - margin.right)
              .attr("height", height_second - margin.top - margin.bottom)
                  .classed("group", true)

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
              .attr("d", line2)
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
              .attr("d", area2)
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
              })).range([0,width_first - margin.left - margin.right]).padding(0.05);

              group_two.selectAll(".bar")
                .data(dataset_two)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", (d)=>{
                  return xBar(d.date)
                })
                .attr("y", (d)=>{
                  return y2(d.value)
                })
                .attr("width", xBar.bandwidth())
                .attr("height", (d)=>{ 
                  return height_second - y2(d.value) })
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

       let maxValValues_two = {};
       let minValValues_two = {};

       dataset_two.forEach(function(entry,i) {
         if (entry.value == val_extent_two[1]) {
          maxValValues_two["date"] = entry.date
          maxValValues_two["rendered"] = entry.rendered
         } else if (entry.value == val_extent_two[0]) {
          minValValues_two["date"] = entry.date
          minValValues_two["rendered"] = entry.rendered
         }
       })
       if (isNaN(+val_extent_two[0])) {
        console.log("")
       } else {
        arr_text_two.push({"value":val_extent_two[1],"date":maxValValues_two["date"],"rendered":maxValValues_two["rendered"]})
        arr_text_two.push({"value":val_extent_two[0],"date":minValValues_two["date"],"rendered":minValValues_two["rendered"]})

       if (config.display_values == "yes") {
         var filter_two = group_two.append("defs")
            .append("filter")
            .attr("id", "blur_two")
            .append("feGaussianBlur")
            .attr("stdDeviation", .8); 

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
                  return y2(d.value) + 10 
                } else {
                  return y2(d.value) - 4
                }
                
              })
              .text((d)=>{
                return d.rendered
              })
              .attr("font-size", 8)
              .attr("font-weight", 700)
              .attr("fill", "white")
              .attr("text-anchor",(d,i)=>{
                if (x(parseTime(d.date))<30) {
                  return "beginning"
                } else {
                  return "end"
                }
                
              })
              .style("opacity",.4)
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
                  return y2(d.value) + 10 
                } else {
                  return y2(d.value) - 4
                }
                
              })
              .text((d)=>{
                return d.rendered
              })
              .attr("font-size", 8)
              .attr("font-weight", 700)
              .attr("text-anchor",(d,i)=>{
                if (x(parseTime(d.date))<30) {
                  return "beginning"
                } else {
                  return "end"
                }
                
              })
          }
       
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
              console.log(error)
            } else {
                console.log(error)
            }
            
        }
      }


        // Callback at the end of the rendering to let Looker know it's finished
        done()
    }
})