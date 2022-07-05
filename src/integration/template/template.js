import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'
import { object } from './bullet'
import * as $ from 'jquery'

const this_environment = "dev";
const done = () => {
	console.log("done")
}    
const menuOptions = "<div id='menu'><h1><strong>Menu</strong></h1><div id='menu-options'></div></div></div>" 
$("body").append(menuOptions)

const keys = Object.keys(object.options)

keys.forEach(function(entry) {
const array_name = object.options[entry].label
	$("#menu-options").append("<p>" + array_name + "</p>")
	var form = $('<form>', {
	    id: 'id-1',
	    class: 'menu-options-entry'
	}).appendTo('#menu-options');

	const array_values = object.options[entry].values;
	

	array_values.forEach(function(ent) {
		// console.log(ent, JSON.stringify(Object.keys(ent)[0]),)
		let str;



		if (ent[Object.keys(ent)[0]] == object.options[entry]["default"]) {
			str = "<input type='radio' id='" + Object.keys(ent)[0] + "' name='" + array_name + "' value='" + Object.keys(ent)[0] + "' checked></input><label for='" + Object.keys(ent)[0] + "'>" + Object.keys(ent)[0] + "</label>"
		} else {
			str = "<input type='radio' id='" + Object.keys(ent)[0] + "' name='" + array_name + "' value='" + Object.keys(ent)[0] + "'></input><label for='" + Object.keys(ent)[0] + "'>" + Object.keys(ent)[0] + "</label>"
		}
		form.append(str)
	})
	

})

d3.json("http://localhost:3001/dataBullet").then(function(data) {
	const details = ""
	console.log(data.data, d3.select("#viz")._groups[0][0], object.options, data.queryResponse, details, done, this_environment)

	
	object.updateAsync(data.data, d3.select("#viz")._groups[0][0], object.options, data.queryResponse, details, done, this_environment)

})