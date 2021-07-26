goog.module('os.im.mapping.location.BaseLonMapping');
goog.module.declareLegacyNamespace();

const {parseLon} = goog.require('os.geo');
const AbstractBaseLatOrLonMapping = goog.require('os.im.mapping.location.AbstractBaseLatOrLonMapping');


/**
 * @extends {AbstractBaseLatOrLonMapping<T, S>}
 * @template T, S
 */
class BaseLonMapping extends AbstractBaseLatOrLonMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {string}
     * @protected
     */
    this.coordField = 'LON';

    /**
     * @type {string}
     * @protected
     */
    this.type = BaseLonMapping.ID;

    /**
     * @type {RegExp}
     * @protected
     */
    this.regex = BaseLonMapping.LON_REGEX;

    /**
     * @type {Function}
     * @protected
     */
    this.parseFn = parseLon;
  }
}

/**
 * @type {string}
 */
BaseLonMapping.ID = 'Longitude';

/**
 * @type {RegExp}
 */
BaseLonMapping.LON_REGEX = /lon(g(i(t(u(d(e)?)?)?)?)?)?\b/i;

exports = BaseLonMapping;
