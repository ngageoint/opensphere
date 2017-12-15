goog.provide('os.data.histo.legend');

goog.require('os.data.histo.ColorMethod');
goog.require('os.histo.NumericBinMethod');
goog.require('os.legend');
goog.require('os.ui.Module');


/**
 * Add a vector layer's color model to the legend.
 * @param {!os.layer.Vector} layer The vector layer.
 * @param {!osx.legend.LegendOptions} options The legend options.
 */
os.data.histo.legend.addVectorColorModel = function(layer, options) {
  var source = /** @type {os.source.Vector} */ (layer.getSource());
  if (source && os.legend.shouldDrawSource(source)) {
    var config = os.legend.getSourceConfig(source, options);
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

        var keys = goog.object.getKeys(colors);

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
          os.legend.queueVectorConfig(config, options, binMethod.getField(), offsetX, true);
        }

        if (keys.length > 0) {
          // TODO: should we use goog.string.caseInsensitiveCompare for the default case?
          var sortFn = binMethod instanceof os.histo.NumericBinMethod ? os.legend.numericCompare :
              goog.array.defaultCompare;
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

            os.legend.queueVectorConfig(config, options, (colorField + key), offsetX);
          }
        }
      }
    }
  }
};


/**
 * The colormodellegendsettings directive.
 * @return {angular.Directive}
 */
os.data.histo.legend.legendSettingsDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/data/histo/colormodellegendsettings.html'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('colormodellegendsettings', [os.data.histo.legend.legendSettingsDirective]);


/**
 * Register a legend plugin to render the color model.
 */
os.data.histo.legend.registerLegendPlugin = function() {
  os.legend.registerLayerPlugin(/** @type {!osx.legend.PluginOptions} */ ({
    render: os.data.histo.legend.addVectorColorModel,
    priority: -100,
    settingsUI: 'colormodellegendsettings',
    defaultSettings: {
      'showAuto': false,
      'showManual': true,
      'showColumn': true
    }
  }));
};
