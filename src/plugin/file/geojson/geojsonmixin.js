goog.declareModuleId('plugin.file.geojson.mixin');

import GeoJSON from 'ol/src/format/GeoJSON.js';

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


    (function() {
      const oldWriteFeatureObject = GeoJSON.prototype.writeFeatureObject;


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
        const object = oldWriteFeatureObject.call(this, feature, opt_options);

        var properties = feature.values_;
        var fields = opt_options.fields;
        for (var key in properties) {
        // exclude private keys, any fields passed in, and any non-primitive value
          if (!((opt_options.includePrivateFields || key.indexOf('_') !== 0) &&
            ((!fields || fields.indexOf(key) > -1) &&
            Object(properties[key]) !== properties[key]))) {
            if (!object.properties) {
              object.properties = {};
            }

            delete object.properties[key];
          }
        }

        return object;
      };
    })();
  }
};
