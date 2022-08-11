import * as d3 from 'd3'
import { formatType, handleErrors } from '../common/utils'

looker.plugins.visualizations.add({

  id: "test",
  label: "Test",
  options: {
    directionality: {
          section: 'Formatting',
          order:1,
          type: 'boolean',
          label: 'Color negative trends',
          default: true
    },
  },

  create: function(element, config) {
    console.log(config)
    element.innerHTML = `
      <style>
        body {
          font-family: Arial;
          font-size: 12px;
        }
      </style>
      <svg>
      </svg>`;
    element.style.fontFamily = `"Open Sans", "Helvetica", sans-serif`

  },

  updateAsync: function(data, element, config, queryResponse, details, done) { 
    console.log(config, data, queryResponse)
    if (queryResponse.fields.dimensions.length == 0) {
      this.addError({title: "No Dimensions", message: "This chart requires dimensions."});
      return;
    }

    done()
  }
});
