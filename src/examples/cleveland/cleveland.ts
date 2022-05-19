import * as d3 from 'd3'
import { formatType, handleErrors } from '../common/utils'

import {
  Link,
  Looker,
  LookerChartUtils,
  Row,
  VisConfig,
  VisualizationDefinition
} from '../types/types'

// Global values provided via the API
declare var looker: Looker
declare var LookerCharts: LookerChartUtils

interface ClevelandVisualization extends VisualizationDefinition {
  svg?: any,
}

const vis: ClevelandVisualization = {
  id: 'cleveland', // id/label not required, but nice for testing and keeping manifests in sync
  label: 'Cleveland',
  options: {
    color_range: {
      type: 'array',
      label: 'Color Range',
      display: 'colors',
      default: ['#27566b', '#ecd796']
    }
  },
  // Set up the initial state of the visualization
  create(element, _config) {
    element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`
    this.svg = d3.select(element).append('svg')
  },
  // Render in response to the data or settings changing
  update(data, element, config, queryResponse) {
    if (!handleErrors(this, queryResponse, {
      min_pivots: 0, max_pivots: 0,
      min_dimensions: 1, max_dimensions: undefined,
      min_measures: 2, max_measures: 2
    })) return

    const width = element.clientWidth
    const height = element.clientHeight

    const dimensions = queryResponse.fields.dimension_like
    const measure = queryResponse.fields.measure_like[0]

    const colorScale: d3.ScaleOrdinal<string, null> = d3.scaleOrdinal()
    const color = colorScale.range(config.color_range || [])

    // data.forEach(row => {
    //   row.taxonomy = {
    //     links: getLinksFromRow(row),
    //     value: dimensions.map((dimension) => row[dimension.name].value)
    //   }
    // })

    const svg = (
      this.svg
      .html('')
      .attr('width', '100%')
      .attr('height', '100%')
      .append('g')
    )

    const label = svg.append('text').attr('y', -height / 2 + 20).attr('x', -width / 2 + 20)

    // TK sort function set up difference
    data.sort(function(a: any,b: any){
      return (a.beginning - a.end) - (b.beginning - b.end);
    })

    // const x:d3.ScaleBand<string> = d3.scaleBand()
    //       .domain(data.map((row:Row)=>{
    //         return row.key;
    //       }))
    //       .range([0, width]);

    // const y:d3.ScaleLinear<number, number> = d3.scaleLinear()
    //       .domain([0,d3.max(data, function(d:object){
    //         return d.Value;
    //       })])
    //       .range([height,0]);

    svg.selectAll(".gap")
      .data(data)
      .enter()
        .append("text")
        .attr("class", (d:any,i:any)=>{
          console.log(d)
          return d.state;
        })
        .classed("gap", true)
        .attr("x", 10)
        .attr("y", 10)
        .text("Text")
          .style("fill", "black")
    


    // svg.selectAll(".gap")
    //   .data(data)
    //   .enter()
    //     .append("line")
    //     .classed("gap", true)
    //     .style("stroke", "#91a1a8")
    //     .attr("x1", (d:any,i:any)=>{
    //         return (x(d.entry) + (x.bandwidth()/2))
    //       })     // x position of the first end of the line
    //       .attr("y1", (d:any,i:any)=>{
    //         return (y(d.end))
    //       })      // y position of the first end of the line
    //       .attr("x2", (d:any,i:any)=>{
    //         return (x(d.entry) + (x.bandwidth()/2))
    //       })     // x position of the second end of the line
    //       .attr("y2", (d:any,i:any)=>{
    //         return (y(d.beginning))
    //       });

    // svg.selectAll(".dot")
    //   .data(data)
    //   .enter()
    //     .append("circle")
    //     .classed("dot", true)
    //     .attr("r", 8)
    //     .attr("cy", (d:any,i:any) => {
    //       return y(d.end)
    //     })
    //     .attr("cx", (d:any,i:any) => {
    //       return (x(d.entry) + (x.bandwidth()/2))
    //     });

    // svg.selectAll(".lowdot")
    //   .data(data)
    //   .enter()
    //     .append("circle")
    //     .classed("lowdot", true)
    //     .attr("cy", (d:any,i:any) => {
    //       return y(d.beginning)
    //     })
    //     .attr("cx", (d:any,i:any) => {
    //       return (x(d.entry) + (x.bandwidth()/2))
    //     })
    //     .attr("r", 8);

  }
}

looker.plugins.visualizations.add(vis)