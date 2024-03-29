goog.declareModuleId('plugin.file.geojson.mixin');

const GeoJSON = goog.require('ol.format.GeoJSON');

const Feature = goog.requireType('ol.Feature');


/**
 * If the mixin has been initialized.
 * @type {boolean}
 */
let initialized = false;


/**
 * Initialize the mixin.
 */
export const init = () => {
  if (!initialized) {
    initialized = true;

    /**
     * Encode a feature as a GeoJSON Feature object.
     *
     * @param {Feature} feature Feature.
     * @param {olx.format.WriteOptions=} opt_options Write options.
     * @return {GeoJSONFeature} Object.
     * @override
     * @suppress {accessControls,duplicate}
     */
    GeoJSON.prototype.writeFeatureObject = function(feature, opt_options) {
      opt_options = this.adaptOptions(opt_options);

      var object = /** @type {GeoJSONFeature} */ ({
        'type': 'Feature'
      });
      var id = feature.getId();
      if (id !== undefined) {
        object.id = id;
      }
      var geometry = feature.getGeometry();
      if (geometry) {
        object.geometry = GeoJSON.writeGeometry_(geometry, opt_options);
      } else {
        object.geometry = null;
      }

      var properties = feature.values_;
      var fields = opt_options.fields;
      for (var key in properties) {
        // exclude private keys, any fields passed in, and any non-primitive value
        if ((opt_options.includePrivateFields || key.indexOf('_') !== 0) &&
            ((!fields || fields.indexOf(key) > -1) &&
            Object(properties[key]) !== properties[key])) {
          if (!object.properties) {
            object.properties = {};
          }

          object.properties[key] = properties[key];
        }
      }

      return object;
    };
  }
};
