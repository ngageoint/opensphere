goog.provide('os.style.TextReader');

goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Text');
goog.require('os.style.AbstractReader');
goog.require('os.style.label');



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
 * @const
 * @type {Array<string>}
 * @private
 */
os.style.TextReader.FIELDS_ = [
  'text',
  'textAlign',
  'textBaseline',
  'font',
  'fillColor',
  'strokeColor',
  'strokeWidth',
  'offsetX',
  'offsetY'
];


/**
 * @type {Array}
 * @const
 * @private
 */
os.style.TextReader.VALUES_ = new Array(os.style.TextReader.FIELDS_.length);


/**
 * @inheritDoc
 */
os.style.TextReader.prototype.getOrCreateStyle = function(configs, opt_keys) {
  opt_keys = opt_keys || [];

  var fields = os.style.TextReader.FIELDS_;
  var values = os.style.TextReader.VALUES_;

  for (var i = 0, n = fields.length; i < n; i++) {
    opt_keys.push(fields[i]);
    values[i] = os.style.getValue(opt_keys, configs);
    opt_keys.pop();
  }

  // do not cache text styles so they can be modified directly for text/color changes. these will be cached on each
  // feature instead.
  return new ol.style.Text({
    text: values[0],
    textAlign: values[1] || 'center',
    textBaseline: values[2] || 'middle',
    font: values[3] || os.style.label.getFont(),
    fill: new ol.style.Fill({
      color: values[4] || 'rgba(255,255,255,1)'
    }),
    stroke: new ol.style.Stroke({
      color: values[5],
      width: values[6]
    }),
    offsetX: values[7],
    offsetY: values[8]
  });
};
