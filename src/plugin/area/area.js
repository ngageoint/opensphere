goog.module('plugin.area');
goog.module.declareLegacyNamespace();

const Feature = goog.require('ol.Feature');
const olArray = goog.require('ol.array');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const RecordField = goog.require('os.data.RecordField');
const fn = goog.require('os.fn');
const jsts = goog.require('os.geo.jsts');
const areaManager = goog.require('os.query.AreaManager');
const query = goog.require('os.ui.query');


/**
 * Process imported features.
 *
 * @param {Array<Feature>} features
 * @param {Object} config
 */
const processFeatures = function(features, config) {
  // filter only valid features
  features = areaManager.getInstance().filterFeatures(features);

  if (features && features.length > 0) {
    var mappings = query.createMappingsFromConfig(config);
    var geometries = features.map(fn.mapFeatureToGeometry).filter(fn.filterFalsey);

    if (config['merge'] && geometries.length > 1) {
      var merged = jsts.merge(geometries);
      if (merged) {
        var feature = new Feature(merged);
        processFeature_(feature, config, mappings);
        areaManager.getInstance().add(feature);
      } else {
        AlertManager.getInstance().sendAlert('Failed merging areas', AlertEventSeverity.ERROR);
      }
    } else {
      features.forEach(function(feature) {
        if (feature && !areaManager.getInstance().get(feature)) {
          processFeature_(feature, config, mappings);
        }
      });

      areaManager.getInstance().bulkAdd(features, true);
    }
  } else {
    AlertManager.getInstance().sendAlert('No Areas Found', AlertEventSeverity.WARNING);
  }
};

/**
 * Process an imported feature.
 *
 * @param {!Feature} feature
 * @param {Object} config
 * @param {!Array<!os.im.mapping.IMapping>} mappings
 */
const processFeature_ = function(feature, config, mappings) {
  // apply mappings to the feature
  query.applyMappings(feature, mappings);

  // Strip out unnecessary feature values (kml style was breaking the refresh)
  feature.getKeys().forEach(function(value) {
    var found = olArray.find(query.featureKeys, function(key) {
      return key.toLowerCase() == value.toLowerCase();
    });
    if (!found) {
      feature.set(value, undefined);
    } else if (found != value) {
      feature.set(found, feature.get(value));
      feature.set(value, undefined);
    }
  });

  feature.set(RecordField.SOURCE_NAME, config[RecordField.SOURCE_NAME], true);
};

exports = {
  processFeatures
};
