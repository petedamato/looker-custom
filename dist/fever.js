(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["fever"] = factory();
	else
		root["fever"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 57);
/******/ })
/************************************************************************/
/******/ ({

/***/ 57:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "object", function() { return object; });
var object = {
  // Id and Label are legacy properties that no longer have any function besides documenting
  // what the visualization used to have. The properties are now set via the manifest
  // form within the admin/visualizations page of Looker.
  id: "line-chart",
  label: "ZDev Line Chart",
  options: {},
  // Set up the initial state of the visualization
  create: function create(element, config) {
    // Insert a <style> tag with some styles we'll use later
    element.innerHTML = "\n            <style>\n              body {\n                  font-family: Arial;\n                  font-size: 12px;\n              }\n            </style>\n            <svg>\n            </svg>";
    element.style.fontFamily = "\"Open Sans\", \"Helvetica\", sans-serif";
  },
  // Render in response to the data or settings changing
  updateAsync: function updateAsync(data, element, config, queryResponse, details, done) {
    if (environment == "prod") {
      if (!handleErrors(this, queryResponse, {
        min_pivots: 0,
        max_pivots: 0,
        min_dimensions: 0,
        max_dimensions: 5,
        min_measures: 0,
        max_measures: 5
      })) return;
    }

    try {
      console.log(data, queryResponse);
      var parseTime = d3.timeParse("%Y-%m-%d");
      var dimensions_ordered = queryResponse.fields.dimension_like;
      var measures_ordered = queryResponse.fields.measure_like;
      var dimensions = {
        margin: {
          top: 15,
          right: 130,
          bottom: 15,
          left: 40
        }
      };
      data.forEach(function (d) {
        dimensions_ordered.forEach(function (j, index) {
          var variable_name = "date" + (index + 1);
          d[variable_name] = parseTime(d[j.name].value);
        });
        measures_ordered.forEach(function (j, index) {
          var variable_name = "value" + (index + 1);

          if (d[j.name].value == null) {
            d[variable_name] = null;
          } else {
            d[variable_name] = +d[j.name].value;
          }
        });
      });
      console.log(data); // const w = element.clientWidth;
      // const h = element.clientHeight;
      // dimensions.boundedWidth = w - dimensions.margin.left - dimensions.margin.right;
      // dimensions.boundedHeight = Math.min(h - dimensions.margin.top - dimensions.margin.bottom,120)
      // const svg = (
      //   d3.select(element).select('svg')
      //     .html('')
      //     .attr('width', '100%')
      //     .attr('height', '100%')
      // )
      // const group = svg.append('g')
      //     .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
      //     .attr("width", "100%")
      //     .attr("height", ((dimensions.boundedHeight) + "px"))
      //         .classed("group", true)
      // // build scales
      // const xMetrics = ["metric"]
      // const xScale = d3.scaleLinear()
      //              .domain([0, d3.max(final_data,function(d,i) {
      //                 return Math.max(+d[0].value,+d[1].value)
      //                 })])
      //              .range([0, dimensions.boundedWidth])
      // const yScale = d3.scaleBand()
      //     .domain(xMetrics.map(d => d))
      //     .range([0, dimensions.boundedHeight])
      //     .padding(0.45)
    } catch (error) {
      if (environment == "prod") {
        if (queryResponse.fields.dimensions.length != queryResponse.fields.measures.length) {
          this.addError({
            title: "Data mismatch",
            message: "This chart requires dimension/measure pairs."
          });
          return;
        }
      } else {
        console.log(error);
      }
    } // Callback at the end of the rendering to let Looker know it's finished


    done();
  }
};

/***/ })

/******/ });
});