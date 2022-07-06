import * as d3 from 'd3'
import * as d3Collection from 'd3-collection'
import { formatType, handleErrors } from '../common/utils'
import { object } from './fever'
import * as $ from 'jquery'

// Query the element
const ele = document.getElementById('viz-container');

// The current position of mouse
let x = 0;
let y = 0;

// The dimension of the element
let w = 0;
let h = 0;



const this_environment = "dev";
const done = () => {
	console.log("done")
}    
const menuOptions = "<div id='menu'><h1><strong>Menu</strong></h1><div id='menu-options'></div></div></div>" 
$("body").append(menuOptions)

const keys = Object.keys(object.options)

keys.forEach(function(entry, i) {
	console.log()
const array_name = object.options[entry].label
	$("#menu-options").append("<p>" + array_name + "</p>")
	var form = $('<form>', {
	    id: 'id-1',
	    class: 'menu-options-entry'
	}).appendTo('#menu-options');

	const array_values = object.options[entry].values;
	console.log(Object.keys(object.options))

	array_values.forEach(function(ent) {

		// console.log(ent, JSON.stringify(Object.keys(ent)[0]),)
		let str;



		if (ent[Object.keys(ent)[0]] == object.options[entry]["default"]) {
			str = "<input type='radio' internal_cat='" + keys[i] + "' internal_value='" + ent[Object.keys(ent)] + "' id='" + Object.keys(ent)[0] + "' name='" + array_name + "' value='" + Object.keys(ent)[0] + "' checked></input><label class='form-label' for='" + Object.keys(ent)[0] + "'>" + Object.keys(ent)[0] + "</label>"
		} else {
			str = "<input type='radio' internal_cat='" + keys[i] + "' internal_value='" + ent[Object.keys(ent)] + "' id='" + Object.keys(ent)[0] + "' name='" + array_name + "' value='" + Object.keys(ent)[0] + "'></input><label class='form-label' for='" + Object.keys(ent)[0] + "'>" + Object.keys(ent)[0] + "</label>"
		}
		form.append(str)
	})
	

})


d3.json("http://localhost:3001/dataBullet").then(function(data) {
	let todays_options = {}

	$('input:radio:checked').each(function() {
		todays_options[this.attributes.internal_cat.value] = this.attributes.internal_value.value
	});

	const details = ""
	// Fire first instance of chart
	object.updateAsync(data.data, d3.select("#viz")._groups[0][0], todays_options, data.queryResponse, details, done, this_environment)
	
	// On change to options, loop through selections and then redraw chart
	$('input:radio').click(function() {
		$('input:radio:checked').each(function() {
			todays_options[this.attributes.internal_cat.value] = this.attributes.internal_value.value
		});
		object.updateAsync(data.data, d3.select("#viz")._groups[0][0], todays_options, data.queryResponse, details, done, this_environment)
	});

	// Handle the mousedown event
	// that's triggered when user drags the resizer
	const mouseDownHandler = function (e) {

	    // Get the current mouse position
	    x = e.clientX;
	    y = e.clientY;

	    // Calculate the dimension of element
	    const styles = window.getComputedStyle(ele);
	    w = parseInt(styles.width, 10);
	    h = parseInt(styles.height, 10);

	    

	    // Attach the listeners to `document`
	    document.addEventListener('mousemove', mouseMoveHandler);
	    document.addEventListener('mouseup', mouseUpHandler);
	};

	const mouseMoveHandler = function (e) {
	    // How far the mouse has been moved
	    const dx = e.clientX - x;
	    const dy = e.clientY - y;

	    // Adjust the dimension of element
	    ele.style.width = `${w + dx}px`;
	    ele.style.height = `${h + dy}px`;
	};

	const mouseUpHandler = function () {
	    // Remove the handlers of `mousemove` and `mouseup`
	    document.removeEventListener('mousemove', mouseMoveHandler);
	    document.removeEventListener('mouseup', mouseUpHandler);
	    object.updateAsync(data.data, d3.select("#viz")._groups[0][0], todays_options, data.queryResponse, details, done, this_environment)
	};

	// Query all resizers
	const resizers = ele.querySelectorAll('.resizer');

	// Loop over them
	[].forEach.call(resizers, function (resizer) {
	    resizer.addEventListener('mousedown', mouseDownHandler);
	});

})