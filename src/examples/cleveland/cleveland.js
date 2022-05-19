import * as d3 from 'd3'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({
  // Id and Label are legacy properties that no longer have any function besides documenting
  // what the visualization used to have. The properties are now set via the manifest
  // form within the admin/visualizations page of Looker
  id: "hello",
  label: "ZDev Hello",
  options: {
    color_range: {
      type: 'array',
      label: 'Color Range',
      display: 'colors',
      default: ['#27566b', '#ecd796']
    }
  },
  // Set up the initial state of the visualization
  create: function(element, config) {
    // Insert a <style> tag with some styles we'll use later.
    element.innerHTML = `
      <style>

      </style>`;
    element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`

    this.svg = d3.select(element).append('svg')
      .classed("this-thee-svg", true)

    // this.svg.append("text").text("Test")
  },
  // Render in response to the data or settings changing
  updateAsync: function(data, element, config, queryResponse, details, done) {

    // Clear any errors from previous updates
    this.clearErrors();

    // Throw some errors and exit if the shape of the data isn't what this chart needs
    if (queryResponse.fields.dimensions.length == 0) {
      this.addError({title: "No Dimensions", message: "This chart requires dimensions."});
      return;
    }

    // We are done rendering! Let Looker know.
    done()
  }
});
