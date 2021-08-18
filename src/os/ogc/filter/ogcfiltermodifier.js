goog.module('os.ogc.filter.OGCFilterModifier');
goog.module.declareLegacyNamespace();

const AbstractModifier = goog.require('os.net.AbstractModifier');
const ModifierConstants = goog.require('os.ogc.filter.ModifierConstants');

const OGCFilterModifierOptions = goog.requireType('os.ogc.filter.OGCFilterModifierOptions');


/**
 */
class OGCFilterModifier extends AbstractModifier {
  /**
   * Constructor.
   * @param {OGCFilterModifierOptions=} opt_options
   */
  constructor(opt_options) {
    super('OGCFilter', 100);

    var options = opt_options != null ? opt_options : {};

    /**
     * @type {boolean}
     * @private
     */
    this.filter_ = options.filter != null ? options.filter : false;

    /**
     * @type {boolean}
     * @private
     */
    this.identifiers_ = options.identifiers != null ? options.identifiers : false;

    /**
     * @type {string}
     * @private
     */
    this.param_ = options.param || 'filter';

    /**
     * @type {boolean}
     * @private
     */
    this.temporal_ = options.temporal != null ? options.temporal : true;
  }

  /**
   * @inheritDoc
   */
  modify(uri) {
    var qd = uri.getQueryData();
    var filters = (this.temporal_ ? ModifierConstants.TEMPORAL : '') +
        (this.filter_ ? ModifierConstants.FILTER : '');

    if (filters || this.identifiers_) {
      var filter = OGCFilterModifier.FILTER_BEGIN +
          (this.identifiers_ || filters ? '<And>' : '') +
          (this.identifiers_ ? ModifierConstants.IDENTIFIERS : '') +
          (filters ? filters : '') +
          (this.identifiers_ || filters ? '</And>' : '') +
          OGCFilterModifier.FILTER_END;

      qd.set(this.param_, filter);
    } else {
      qd.remove(this.param_);
    }
  }
}

/**
 * @type {string}
 * @const
 */
OGCFilterModifier.FILTER_BEGIN = '<Filter xmlns="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml">';

/**
 * @type {string}
 * @const
 */
OGCFilterModifier.FILTER_END = '</Filter>';

exports = OGCFilterModifier;
