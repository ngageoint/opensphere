goog.provide('os.im.mapping.location.BaseLatMapping');
goog.require('os.geo');
goog.require('os.im.mapping.location.AbstractBaseLatOrLonMapping');



/**
 * @extends {os.im.mapping.AbstractPositionMapping.<T, S>}
 * @constructor
 * @template T, S
 */
os.im.mapping.location.BaseLatMapping = function() {
  os.im.mapping.location.BaseLatMapping.base(this, 'constructor');

  /**
   * @type {string}
   * @protected
   */
  this.coordField = 'LAT';

  /**
   * @type {string}
   * @protected
   */
  this.type = os.im.mapping.location.BaseLatMapping.ID;

  /**
   * @type {RegExp}
   * @protected
   */
  this.regex = os.im.mapping.location.BaseLatMapping.LAT_REGEX;

  /**
   * @type {Function}
   * @protected
   */
  this.parseFn = os.geo.parseLat;
};
goog.inherits(os.im.mapping.location.BaseLatMapping, os.im.mapping.location.AbstractBaseLatOrLonMapping);


/**
 * @type {string}
 * @const
 */
os.im.mapping.location.BaseLatMapping.ID = 'Latitude';


/**
 * @type {RegExp}
 * @const
 */
os.im.mapping.location.BaseLatMapping.LAT_REGEX = /lat(i(t(u(d(e)?)?)?)?)?\b/i;

