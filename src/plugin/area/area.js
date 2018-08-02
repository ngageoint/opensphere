goog.provide('plugin.area');

goog.require('ol.Feature');
goog.require('os.data.RecordField');
goog.require('os.fn');
goog.require('os.geo.jsts');


/**
 * Process imported features.
 * @param {Array<ol.Feature>} features
 * @param {Object} config
 */
plugin.area.processFeatures = function(features, config) {
  // filter only valid features
  features = os.ui.areaManager.filterFeatures(features);

  if (features && features.length > 0) {
    var mappings = os.ui.query.createMappingsFromConfig(config);
    var geometries = features.map(os.fn.mapFeatureToGeometry).filter(os.fn.filterFalsey);

    if (config['merge'] && geometries.length > 1) {
      var merged = os.geo.jsts.merge(geometries);
      if (merged) {
        var feature = new ol.Feature(merged);
        plugin.area.processFeature_(feature, config, mappings);
        os.ui.areaManager.add(feature);
      } else {
        os.alertManager.sendAlert('Failed merging areas', os.alert.AlertEventSeverity.ERROR);
      }
    } else {
      features.forEach(function(feature) {
        if (feature && !os.ui.areaManager.get(feature)) {
          plugin.area.processFeature_(feature, config, mappings);
        }
      });

      os.ui.areaManager.bulkAdd(features, true);
    }
  } else {
    os.alertManager.sendAlert('No Areas Found', os.alert.AlertEventSeverity.WARNING);
  }
};


/**
 * Process an imported feature.
 * @param {!ol.Feature} feature
 * @param {Object} config
 * @param {!Array<!os.im.mapping.IMapping>} mappings
 * @private
 */
plugin.area.processFeature_ = function(feature, config, mappings) {
  // apply mappings to the feature
  os.ui.query.applyMappings(feature, mappings);

  // Strip out unnecessary feature values (kml style was breaking the refresh)
  feature.getKeys().forEach(function(value) {
    var found = goog.array.find(os.ui.query.featureKeys, function(key) {
      return key.toLowerCase() == value.toLowerCase();
    });
    if (!found) {
      feature.set(value, undefined);
    } else if (found != value) {
      feature.set(found, feature.get(value));
      feature.set(value, undefined);
    }
  });

  feature.set(os.data.RecordField.SOURCE_NAME, config[os.data.RecordField.SOURCE_NAME], true);
};
