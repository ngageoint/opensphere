goog.provide('os.style.TextReader');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Text');
goog.require('os.style.AbstractReader');



/**
 * Label style reader
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
  var font = /** @type {string|undefined} */ (config['font']) || 'bold 12px Arial';
  var fillColor = /** @type {string|undefined} */ (config['fillColor']) || 'rgba(255,255,255,1)';
  var strokeColor = /** @type {string|undefined} */ (config['strokeColor']) || 'rgba(0,0,0,1)';
  var strokeWidth = goog.isDef(config['strokeWidth']) ? /** @type {number} */ (config['strokeWidth']) : 2;
  var offsetX = goog.isDef(config['offsetX']) ? /** @type {number} */ (config['offsetX']) : 0;
  var offsetY = goog.isDef(config['offsetY']) ? /** @type {number} */ (config['offsetY']) : 0;

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
    offsetY: offsetY
  });
};
