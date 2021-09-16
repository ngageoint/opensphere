goog.module('os.im.mapping.location.BaseLatMapping');

const {parseLat} = goog.require('os.geo');
const AbstractBaseLatOrLonMapping = goog.require('os.im.mapping.location.AbstractBaseLatOrLonMapping');


/**
 * @extends {AbstractBaseLatOrLonMapping<T, S>}
 * @template T, S
 */
class BaseLatMapping extends AbstractBaseLatOrLonMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {string}
     * @protected
     */
    this.coordField = 'LAT';

    /**
     * @type {string}
     * @protected
     */
    this.type = BaseLatMapping.ID;

    /**
     * @type {RegExp}
     * @protected
     */
    this.regex = BaseLatMapping.LAT_REGEX;

    /**
     * @type {Function}
     * @protected
     */
    this.parseFn = parseLat;
  }
}

/**
 * @type {string}
 */
BaseLatMapping.ID = 'Latitude';

/**
 * @type {RegExp}
 */
BaseLatMapping.LAT_REGEX = /lat(i(t(u(d(e)?)?)?)?)?\b/i;

exports = BaseLatMapping;
