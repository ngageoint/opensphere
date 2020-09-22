goog.provide('os.style.TextReader');

goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Text');
goog.require('os.style.AbstractReader');
goog.require('os.style.label');



/**
 * Label style reader
 *
 * @extends {os.style.AbstractReader<!ol.style.Text>}
 * @constructor
 */
os.style.TextReader = function() {
  os.style.TextReader.base(this, 'constructor');
};
goog.inherits(os.style.TextReader, os.style.AbstractReader);


/**
 * @inheritDoc
 */
os.style.TextReader.prototype.getOrCreateStyle = function(config) {
  var text = /** @type {string|undefined} */ (config['text']);
  var textAlign = /** @type {string|undefined} */ (config['textAlign']) || 'center';
  var textBaseline = /** @type {string|undefined} */ (config['textBaseline']) || 'middle';
  var font = /** @type {string|undefined} */ (config['font']) || os.style.label.getFont();

  var fillColor;
  var strokeColor;

  // OpenSphere represents fill/stroke color as a direct property, while style parsers like ol-mapbox-style represent
  // fill/stroke as an object with a color property. Support both, preferring the OpenSphere value.
  if (config['fillColor']) {
    fillColor = /** @type {string} */ (config['fillColor']);
  } else if (config['fill'] && config['fill']['color']) {
    fillColor = /** @type {string} */ (config['fill']['color']);
  } else {
    fillColor = 'rgba(255,255,255,1)';
  }

  if (config['strokeColor']) {
    strokeColor = /** @type {string} */ (config['strokeColor']);
  } else if (config['stroke'] && config['stroke']['color']) {
    strokeColor = /** @type {string} */ (config['stroke']['color']);
  } else {
    strokeColor = 'rgba(0,0,0,1)';
  }

  var strokeWidth = config['strokeWidth'] !== undefined ? /** @type {number} */ (config['strokeWidth']) : 2;
  var offsetX = config['offsetX'] !== undefined ? /** @type {number} */ (config['offsetX']) : 0;
  var offsetY = config['offsetY'] !== undefined ? /** @type {number} */ (config['offsetY']) : 0;
  var placement = /** @type {ol.style.TextPlacement|undefined} */ (config['placement']);

  // do not cache text styles so they can be modified directly for text/color changes. these will be cached on each
  // feature instead.
  return new ol.style.Text({
    text: text,
    textAlign: textAlign,
    textBaseline: textBaseline,
    font: font,
    fill: new ol.style.Fill({
      color: fillColor
    }),
    stroke: new ol.style.Stroke({
      color: strokeColor,
      width: strokeWidth
    }),
    offsetX: offsetX,
    offsetY: offsetY,
    placement: placement
  });
};
