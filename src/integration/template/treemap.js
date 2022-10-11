export const object = {
  // Id and Label are legacy properties that no longer have any function besides documenting
  // what the visualization used to have. The properties are now set via the manifest
  // form within the admin/visualizations page of Looker
  id: "test",
  label: "ZDev Test",
  options: {
 
  },
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
          body {
              font-family: Roboto;
              font-size: 12px;
          }
          .tick {
            font-family: Roboto;
          }
          .label {
            font-size: 10px;
          }
            .tooltip {
                color: white;
                /*box-shadow: 2px 2px 5px;*/
            }
        .gridline {
                stroke: rgb(230, 230, 230);
                shape-rendering: crispEdges;
                stroke-opacity: .1;
            }
        .cleveland-text-large {
          font-size: 72px;
        }
        .cleveland-text-large {
          font-size: 18px;
        }
        .gridline {
          opacity:.1;
        }
                    .value-headers {
                font-size: 12px;
            }
            .value-headers-body {
                font-weight: 500;
            }
      </style>
      <svg>
      </svg>`;
    element.style.fontFamily = `Roboto,"Open Sans", "Helvetica", sans-serif`

  },
  // Render in response to the data or settings changing
  updateAsync: function(data, element, config, queryResponse, details, done, environment = "prod") {
    if (environment == "prod") {
      if (!handleErrors(this, queryResponse, {
        min_pivots: 0, max_pivots: undefined,
        min_dimensions: 0, max_dimensions: undefined,
        min_measures: 0, max_measures: undefined
      })) return
    }

    d3.select("#vis").select("svg").html("")

  const convertNull = function(input) {
      if (input == null) {
        return 0
      } else {
        return input
      }
    }

    const convertNullString = function(input) {
      if (input == null) {
        return "N/A"
      } else {
        return input
      }
    }

    const checkForRule = function(input, valObj) {
      let test = false
      valObj.forEach((ent,i)=>{
        if (input == ent.rule) {
          test = i
          return
        }
      })
      return test
    }
    console.log(queryResponse)
    const measures = queryResponse.fields.measure_like;
    const dimensions = queryResponse.fields.dimension_like;
    const pivots = Object.keys(data[0]["price_requests.quoted_shipment_count"])

    let data_remix_rule = []
    let data_remix_shipper = []
    let shipper_tracker = []
    
    let data_remix = []
    let shipper_mix = []
    let rules_order = []
    
    data.forEach((entry,i)=>{
      const first_label = dimensions[1]["label"].replace("Entity Entity ","")
      let datapod = {}
      let poddata = {}
      datapod["value"] = entry[measures[0]["name"]]["value"]
      datapod["key"] = String(entry[dimensions[2]["name"]]["value"])
      datapod["shipper"] = entry[dimensions[1]["name"]]["value"]
      data_remix_shipper.push(datapod)
      
      poddata["value"] = entry[measures[0]["name"]]["value"]
      poddata["key"] = entry[dimensions[1]["name"]]["value"]
      poddata["rule"] = String(entry[dimensions[2]["name"]]["value"])
      data_remix_rule.push(poddata)
      // console.log(data_remix_rule, data_remix_shipper)
    })
       const options = {
          "rootName": "Total shipment volume",
          "level": ["shipper"],
          "lastchildrenkey1":'key',
          "lastchildrenkey2":'value',
      }
function getListJson(data,opts){
      var newData = { name :opts.rootName, children : [] }
       var levels = opts.level;

        // For each data row, loop through the expected levels traversing the output tree
        data_remix_shipper.forEach(function(d){
            // Keep this as a reference to the current level
            var depthCursor = newData.children;
            // Go down one level at a time
            levels.forEach(function( property, depth ){

                // Look to see if a branch has already been created
                var index;
                depthCursor.forEach(function(child,i){
                    if ( d[property] == child.name ) index = i;
                });
                // Add a branch if it isn't there
                if ( isNaN(index) ) {
                    depthCursor.push({ name : d[property], children : []});
                    index = depthCursor.length - 1;
                }
                // Now reference the new child array as we go deeper into the tree
                depthCursor = depthCursor[index].children;
                // This is a leaf, so add the last element to the specified branch
                if ( depth === levels.length - 1 ) depthCursor.push({ name : d[opts.lastchildrenkey1], size : d[opts.lastchildrenkey2] });
            });
        });

        return newData;
    }
    
var data2 = getListJson(data_remix_shipper,options)

const getNode = d3.select("#vis");

var margin = {top: 24, right: 0, bottom: -24, left: 0};

// Update this once we have a better idea how Looker integration will look
const new_node_width = getNode.select(function() { return this.parentNode; })
const new_node_height = getNode.select(function() { return this.parentNode; })
const w = new_node_width.node().getBoundingClientRect().width;
const h = new_node_height.node().getBoundingClientRect().height;

const width = w - margin.left - margin.right;
const height = h - margin.bottom - margin.top;

const formatNumber = d3.format(",d");
let transitioning;

var x = d3.scaleLinear()
.domain([0, width])
.range([0, width]);

var y = d3.scaleLinear()
.domain([0, height - margin.top - margin.bottom])
.range([0, height - margin.top - margin.bottom]);

var color = d3.scaleOrdinal()
.range(["#27566b","#8cbb61","#007b82","#f1cc56","#339f7b"]
.map(function(c) { c = d3.rgb(c); c.opacity = 0.95; return c; }));
//var color = d3.scaleOrdinal(d3.schemeCategory20.map(fader));

var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.2); };
var format = d3.format(",d");
var treemap;
var svg, grandparent;

updateDrillDown();

function updateDrillDown() {
  if (svg) {
    svg.selectAll("*").remove();
  } else {
//     var treemap = d3.layout.treemap()
//        .children(function(d, depth) { return depth ? null : d._children; })
//        .sort(function(a, b) { return a.value - b.value; })
//        .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
//        .round(false);
    
    svg = d3.select("#vis").select("svg")
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.bottom - margin.top)
      .style("margin-left", -margin.left + "px")
      .style("margin.right", -margin.right + "px")
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .style("shape-rendering", "crispEdges");    
    
    grandparent = svg.append("g")
      .attr("class", "grandparent");
      
    grandparent.append("rect")
      .attr("y", -margin.top)
      .attr("width", width)
      .attr("height", margin.top);
      
    grandparent.append("text")
      .attr("x", 6)
      .attr("y", 6 - margin.top)
      .attr("dy", ".75em")
      .attr("fill", "white");    
     
   treemap = d3.treemap()
    .tile(d3.treemapResquarify.ratio(height / width * 0.5 * (1 + Math.sqrt(5))))
    .size([width, height])
    .round(false)
    .paddingInner(1);
  }
          
  var root = d3.hierarchy(data2)
     .eachBefore(function(d) { d.id = (d.parent ? d.parent.id + "." : "") + d.data.name; })
     .sum((d) => d.size)
     .sort(function(a, b) {
     //console.log('initial root sort a ' + a.value + ' b ' + b.value);
     return b.height - a.height || b.value - a.value;
    });
      
  initialize(root);
  accumulate(root);
  layout(root);
  treemap(root);
  display(root);
};

function initialize(root) {
  root.x = root.y = 0;
  root.x1 = width;
  root.y1 = height;
  root.depth = 0;
 }

// Aggregate the values for internal nodes. This is normally done by the
// treemap layout, but not here because of our custom implementation.
// We also take a snapshot of the original children (_children) to avoid
// the children being overwritten when when layout is computed.
function accumulate(d) {
  // console.log('accumulate called ' + d.data.name);
  return (d._children = d.children)
     ? d.value = d.children.reduce(function(p, v) { return p + accumulate(v); }, 0) : d.value;
  }

// Compute the treemap layout recursively such that each group of siblings
// uses the same size (1×1) rather than the dimensions of the parent cell.
// This optimizes the layout for the current zoom state. Note that a wrapper
// object is created for the parent node for each group of siblings so that
// the parent’s dimensions are not discarded as we recurse. Since each group
// of sibling was laid out in 1×1, we must rescale to fit using absolute
// coordinates. This lets us use a viewport to zoom.
function layout(d) {
  if (d._children) {
//    treemap.nodes({_children: d._children});
//    treemap(d);
    d._children.forEach(function(c) {
      //c.x0 = d.x0 + c.x0 * (d.x1 - d.x0);
      //c.y0 = d.y0 + c.y0 * (d.y1 - d.y0);
      //c.x1 *= d.x1;
      //c.y1 *= d.y1;    
      c.x0 = d.x0 + c.x0 * d.x1;
      c.y0 = d.y0 + c.y0 * d.y1;
      c.x1 *= (d.x1 - d.x0);
      c.y1 *= (d.y1 - d.y0);
      c.parent = d;
      layout(c);
    });
  }
}

function display(d) {
  grandparent
    .datum(d.parent)
    .on("click", transition)
    .select("text")
    .text(name(d));

  var g1 = svg.insert("g", ".grandparent")
    .datum(d)
    .attr("class", "depth");
  
  var g = g1.selectAll("g")
    .data(d._children)
    .enter().append("g");
 
  g.filter(function(d) { return d._children; })
    .classed("children", true)
    .on("click", transition);
  
  var children = g.selectAll(".child")
    .data(function(d) { return d._children || [d]; })
    .enter().append("g");
  
  children.append("rect")
    .attr("class", "child")
    .call(rect)
    .append("title")
    .text(function(d) { return d.data.name + " (" + formatNumber(d.value) + ")"; });

  children.append("text")
    .attr("class", "ctext")
    .text(function(d) { return d.data.name; })
    .call(text2);
  
  g.append("rect")
    .attr("class", (d)=>{
      return "parent"
    })
    .call(rect);
  
  var t = g.append("text")
    .attr("class", "ptext")
    .attr("pointer-events", "none")
    .attr("dy", ".75em")
  
  t.append("tspan")
    .text(function(d) { return d.data.name; });

  t.append("tspan")
    .attr("dy", "1.0em")
    .text(function(d) { return formatNumber(d.value); });
  
  t.call(text);
  
  g.selectAll("rect")
    .style("fill", function(d) { 
      return color(d.data.name); });
  
  function transition(d) {
    if (transitioning || !d) return;
    transitioning = true;
    var g2 = display(d),
      t1 = g1.transition().duration(750),
      t2 = g2.transition().duration(750);
      
      // Update the domain only after entering new elements.
      //x.domain([d.x0, d.x0 + d.x1]);
      //y.domain([d.y0, d.y0 + d.y1]);
      x.domain([d.x0, d.x0 + (d.x1 - d.x0)]);
      y.domain([d.y0, d.y0 + (d.y1 - d.y0)]);

      // Enable anti-aliasing during the transition.
      svg.style("shape-rendering", null);

      // Draw child nodes on top of parent nodes.
      svg.selectAll(".depth").sort(function(a, b) { 
        //console.log('.depth sort a ' + a.depth + ' b ' + b.depth);
        return a.depth - b.depth; });

      // Fade-in entering text.
      g2.selectAll("text").style("fill-opacity", 0);

      // Transition to the new view.
      t1.selectAll(".ptext").call(text).style("fill-opacity", 0);
      t2.selectAll(".ptext").call(text).style("fill-opacity", 1);
      t1.selectAll(".ctext").call(text2).style("fill-opacity", 0);
      t2.selectAll(".ctext").call(text2).style("fill-opacity", 1);
      t1.selectAll("rect").call(rect);
      t2.selectAll("rect").call(rect);

      // Remove the old node when the transition is finished.
      t1.remove().on("end", function() {
      svg.style("shape-rendering", "crispEdges");
      transitioning = false;
      d3.selectAll(".parent")
        .on("mouseover", function(){
          tooltip.attr("class", "tooltip visible")
          tooltip.html($(this).attr("label"))
          tooltip.style("left", d3.mouse(d3.event.target)[0] + "px").style("top", d3.mouse(d3.event.target)[1]  + "px").style("opacity", 1)
        })
        .on("mousemove", function(){
          tooltip.style("left", d3.mouse(d3.event.target)[0]  + "px").style("top", d3.mouse(d3.event.target)[1]  + "px")
        })
        .on("mouseout", function(){
          tooltip.attr("class", "tooltip")
          tooltip.style("opacity", 0)
        })
    });
  }
  return g;
}

const tooltip = d3.select(".tooltip")
    .style("background-color", "#262d33")
        .style("border-radius", "2px")
        .style("padding", "5px")
        .style("position", "absolute")
        .style("pointer-events","none")
        .html("Shipper")

d3.selectAll(".parent")
  .on("mouseover", function(){
    tooltip.attr("class", "tooltip visible")
    tooltip.html($(this).attr("label"))
    tooltip.style("left", d3.mouse(d3.event.target)[0] + "px").style("top", d3.mouse(d3.event.target)[1]  + "px").style("opacity", 1)
  })
  .on("mousemove", function(){
    tooltip.style("left", d3.mouse(d3.event.target)[0]  + "px").style("top", d3.mouse(d3.event.target)[1]  + "px")
  })
  .on("mouseout", function(){
    tooltip.attr("class", "tooltip")
    tooltip.style("opacity", 0)
  })

function text(text) {
  text.selectAll("tspan")
    .attr("x", function(d) { return x(d.x0) + 6; })
  text.attr("x", function(d) { return x(d.x0) + 6; })
    .attr("y", function(d) { return y(d.y0) + 3; })
    .style("opacity", function(d) {
       var w = x(d.x1) - x(d.x0);
       //console.log("text opacity setting textlength " + this.getComputedTextLength() + " d size " + w);
       return this.getComputedTextLength() < w - 6 ? 1 : 0; });
  }

function text2(text) {
  text.attr("x", function(d) {
     return x(d.x1) - this.getComputedTextLength() - 6;
  })
  .attr("y", function(d) { return y(d.y1) - 6; })
  .style("opacity", function(d) {
     var w = x(d.x1) - x(d.x0);
     //console.log("text2 opacity setting textlength " + this.getComputedTextLength() + " d size " + w);
     return this.getComputedTextLength() < w - 6 ? 1 : 0;
  });
}

function rect(rect) {
  rect.attr("x", function(d) { return x(d.x0); })
    .attr("y", function(d) { return y(d.y0); })
    .attr("label", function(d) {
      if (d.data.name) {
        return d.data.name
      }
    })
    .attr("width", function(d) {
      var w = x(d.x1) - x(d.x0);
      //console.log('id ' + d.id +' rect width ' + w);
      return w;
  })
    .attr("height", function(d) { 
      var h = y(d.y1) - y(d.y0);
      //console.log('id ' + d.id +' rect height ' + h);
      return h;
  });
}

function name(d) {
  return d.parent ? name(d.parent) + " / " + d.data.name + " (" + formatNumber(d.value) + ")" : d.data.name + " (" + formatNumber(d.value) + ")";
}

// function classify(d) {
//   console.log(d)
//   return "parent "
// }


    


    done()
  }
}