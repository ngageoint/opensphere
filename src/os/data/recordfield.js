goog.provide('os.data.RecordField');
goog.require('goog.object');


/**
 * Fields set on ol.Feature objects since we can't extend the class as a Record.
 * @enum {string}
 */
os.data.RecordField = {
  ALPHA: 'alpha',
  ALTITUDE_MODE: 'altitudeMode',
  COLOR: 'color',
  ELLIPSE: 'ellipse',
  GEOM: 'geometry',
  DRAWING_LAYER_NODE: '_node',
  FEATURE_TYPE: '_featureType',
  HTML_DESCRIPTION: '_htmlDescription',
  INTERACTIVE: '_interactive',
  LINE_OF_BEARING: 'lineOfBearing',
  LINE_OF_BEARING_ERROR_HIGH: 'lineOfBearingErrorHigh',
  LINE_OF_BEARING_ERROR_LOW: 'lineOfBearingErrorLow',
  RING: '_ring',
  RING_OPTIONS: '_ringOptions',
  SOURCE_ID: 'sourceId',
  SOURCE_NAME: '_sourceName',
  TIME: 'recordTime',
  VISIBLE: 'visibleNonTimeline'
};


/**
 * @type {RegExp}
 * @const
 */
os.data.RecordField.REGEXP = (function() {
  var values = goog.object.getValues(os.data.RecordField);
  for (var i = 0, n = values.length; i < n; i++) {
    values[i] = '(' + values[i] + ')';
  }

  // anything that starts with an underscore, or matches one of the record fields
  return new RegExp('^(_.*|' + values.join('|') + ')$');
})();
