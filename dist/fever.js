!function(e,n){"object"==typeof exports&&"object"==typeof module?module.exports=n():"function"==typeof define&&define.amd?define([],n):"object"==typeof exports?exports.fever=n():e.fever=n()}(window,(function(){return function(e){var n={};function t(r){if(n[r])return n[r].exports;var o=n[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,t),o.l=!0,o.exports}return t.m=e,t.c=n,t.d=function(e,n,r){t.o(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:r})},t.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},t.t=function(e,n){if(1&n&&(e=t(e)),8&n)return e;if(4&n&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(t.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&n&&"string"!=typeof e)for(var o in e)t.d(r,o,function(n){return e[n]}.bind(null,o));return r},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},t.p="",t(t.s=52)}({52:function(e,n,t){"use strict";t.r(n),t.d(n,"object",(function(){return r}));var r={id:"line-chart",label:"ZDev Line Chart",options:{},create:function(e,n){e.innerHTML="\n            <style>\n              body {\n                  font-family: Arial;\n                  font-size: 12px;\n              }\n            </style>\n            <svg>\n            </svg>",e.style.fontFamily='"Open Sans", "Helvetica", sans-serif'},updateAsync:function(e,n,t,r,o,i){if("prod"!=environment||handleErrors(this,r,{min_pivots:0,max_pivots:0,min_dimensions:0,max_dimensions:5,min_measures:0,max_measures:5})){try{console.log(e,r);var s=d3.timeParse("%Y-%m-%d"),u=r.fields.dimension_like,a=r.fields.measure_like;e.forEach((function(e){u.forEach((function(n,t){e["date"+(t+1)]=s(e[n.name].value)})),a.forEach((function(n,t){var r="value"+(t+1);null==e[n.name].value?e[r]=null:e[r]=+e[n.name].value}))})),console.log(e)}catch(e){if("prod"==environment){if(r.fields.dimensions.length!=r.fields.measures.length)return void this.addError({title:"Data mismatch",message:"This chart requires dimension/measure pairs."})}else console.log(e)}i()}}}}})}));