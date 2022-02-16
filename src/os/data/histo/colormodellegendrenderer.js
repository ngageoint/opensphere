goog.declareModuleId('os.data.histo.legend');

import {defaultSort} from '../../array/array.js';
import NumericBinMethod from '../../histo/numericbinmethod.js';
import * as legend from '../../legend/legend.js';
import {ROOT} from '../../os.js';
import Module from '../../ui/module.js';

const googObject = goog.require('goog.object');

const {default: VectorLayer} = goog.requireType('os.layer.Vector');
const {default: VectorSource} = goog.requireType('os.source.Vector');


/**
 * Add a vector layer's color model to the legend.
 *
 * @param {!VectorLayer} layer The vector layer.
 * @param {!osx.legend.LegendOptions} options The legend options.
 */
export const addVectorColorModel = function(layer, options) {
  var source = /** @type {VectorSource} */ (layer.getSource());
  if (source && legend.shouldDrawSource(source)) {
    var config = legend.getSourceConfig(source, options);
    var model = source.getColorModel();
    if (model && (options['showAuto'] || options['showManual'])) {
      var binMethod = model.getBinMethod();
      if (binMethod) {
        var colorField = binMethod.getField() + ': ';
        var colors = {};

        // add manual colors if configured
        var manualColors = model.getManualBinColors();
        if (options['showManual'] && manualColors) {
          for (var key in manualColors) {
            colors[key] = manualColors[key];
          }
        }

        // add auto colors if configured
        var binColors = model.getBinColors();
        if (options['showAuto']) {
          for (var key in binColors) {
            // manual colors will also be included in this map, so skip them here
            if (!(key in manualColors)) {
              colors[key] = binColors[key];
            }
          }
        }

        var keys = googObject.getKeys(colors);

        // only show column header if requested and if there is data
        if (!options['showColumn'] && keys.length > 0) {
          colorField = '';

          // make a transparent icon so it indents correctly
          if (config['image'] && config['image']['fill']) {
            config['image']['fill']['color'] = 'rgba(0,0,0,0)';
          }

          if (config['stroke']) {
            config['stroke']['color'] = 'rgba(0,0,0,0)';
          }

          var offsetX = options.showVector ? 10 : 0;
          legend.queueVectorConfig(config, options, binMethod.getField(), offsetX, true);
        }

        if (keys.length > 0) {
          // TODO: should we use goog.string.caseInsensitiveCompare for the default case?
          var sortFn = binMethod instanceof NumericBinMethod ? legend.numericCompare : defaultSort;
          keys.sort(sortFn);

          for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (config['image'] && config['image']['fill']) {
              config['image']['fill']['color'] = colors[key];
            }

            if (config['stroke']) {
              config['stroke']['color'] = colors[key];
            }

            var offsetX = 0;
            if (options.showVector) {
              offsetX += 10;
            }

            if (!options['showColumn']) {
              offsetX += 10;
            }

            legend.queueVectorConfig(config, options, (colorField + key), offsetX);
          }
        }
      }
    }
  }
};

/**
 * The colormodellegendsettings directive.
 *
 * @return {angular.Directive}
 */
export const legendSettingsDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: ROOT + 'views/data/histo/colormodellegendsettings.html'
  };
};


/**
 * Add the directive to the module.
 */
Module.directive('colormodellegendsettings', [legendSettingsDirective]);


/**
 * Register a legend plugin to render the color model.
 */
export const registerLegendPlugin = function() {
  legend.registerLayerPlugin(/** @type {!osx.legend.PluginOptions} */ ({
    render: addVectorColorModel,
    priority: -100,
    settingsUI: 'colormodellegendsettings',
    defaultSettings: {
      'showAuto': false,
      'showManual': true,
      'showColumn': true
    }
  }));
};
