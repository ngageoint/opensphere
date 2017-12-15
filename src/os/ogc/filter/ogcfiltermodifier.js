goog.provide('os.ogc.filter.OGCFilterModifier');
goog.provide('os.ogc.filter.OGCFilterModifierOptions');
goog.require('os.net.AbstractModifier');
goog.require('os.ogc.filter.ModifierConstants');


/**
 * @typedef {{
 *   filter: (boolean|undefined),
 *   identifiers: (boolean|undefined),
 *   param: (string|undefined),
 *   temporal: (boolean|undefined)
 *   }}
 */
os.ogc.filter.OGCFilterModifierOptions;



/**
 * @param {os.ogc.filter.OGCFilterModifierOptions=} opt_options
 * @extends {os.net.AbstractModifier}
 * @constructor
 */
os.ogc.filter.OGCFilterModifier = function(opt_options) {
  var options = goog.isDefAndNotNull(opt_options) ? opt_options : {};

  /**
   * @type {boolean}
   * @private
   */
  this.filter_ = goog.isDefAndNotNull(options.filter) ? options.filter : false;

  /**
   * @type {boolean}
   * @private
   */
  this.identifiers_ = goog.isDefAndNotNull(options.identifiers) ? options.identifiers : false;

  /**
   * @type {string}
   * @private
   */
  this.param_ = options.param || 'filter';

  /**
   * @type {boolean}
   * @private
   */
  this.temporal_ = goog.isDefAndNotNull(options.temporal) ? options.temporal : true;

  os.ogc.filter.OGCFilterModifier.base(this, 'constructor', 'OGCFilter', 100);
};
goog.inherits(os.ogc.filter.OGCFilterModifier, os.net.AbstractModifier);


/**
 * @type {string}
 * @const
 */
os.ogc.filter.OGCFilterModifier.FILTER_BEGIN = '<Filter xmlns="http://www.opengis.net/ogc" ' +
    'xmlns:gml="http://www.opengis.net/gml">';


/**
 * @type {string}
 * @const
 */
os.ogc.filter.OGCFilterModifier.FILTER_END = '</Filter>';


/**
 * @inheritDoc
 */
os.ogc.filter.OGCFilterModifier.prototype.modify = function(uri) {
  var qd = uri.getQueryData();
  var filters = (this.temporal_ ? os.ogc.filter.ModifierConstants.TEMPORAL : '') +
      (this.filter_ ? os.ogc.filter.ModifierConstants.FILTER : '');

  if (filters || this.identifiers_) {
    var filter = os.ogc.filter.OGCFilterModifier.FILTER_BEGIN +
        (this.identifiers_ || filters ? '<And>' : '') +
        (this.identifiers_ ? os.ogc.filter.ModifierConstants.IDENTIFIERS : '') +
        (filters ? filters : '') +
        (this.identifiers_ || filters ? '</And>' : '') +
        os.ogc.filter.OGCFilterModifier.FILTER_END;

    qd.set(this.param_, filter);
  } else {
    qd.remove(this.param_);
  }
};
