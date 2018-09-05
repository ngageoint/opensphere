goog.provide('os.im.mapping.location.BaseLonMapping');

goog.require('os.geo');
goog.require('os.im.mapping.AbstractPositionMapping');
goog.require('os.im.mapping.location.AbstractBaseLatOrLonMapping');



/**
 * @extends {os.im.mapping.location.AbstractBaseLatOrLonMapping.<T, S>}
 * @constructor
 * @template T, S
 */
os.im.mapping.location.BaseLonMapping = function() {
  os.im.mapping.location.BaseLonMapping.base(this, 'constructor');

  /**
   * @type {string}
   * @protected
   */
  this.coordField = 'LON';

  /**
   * @type {string}
   * @protected
   */
  this.type = os.im.mapping.location.BaseLonMapping.ID;

  /**
   * @type {RegExp}
   * @protected
   */
  this.regex = os.im.mapping.location.BaseLonMapping.LON_REGEX;

  /**
   * @type {Function}
   * @protected
   */
  this.parseFn = os.geo.parseLon;
};
goog.inherits(os.im.mapping.location.BaseLonMapping, os.im.mapping.location.AbstractBaseLatOrLonMapping);


/**
 * @type {string}
 * @const
 */
os.im.mapping.location.BaseLonMapping.ID = 'Longitude';


/**
 * @type {RegExp}
 * @const
 */
os.im.mapping.location.BaseLonMapping.LON_REGEX = /lon(g(i(t(u(d(e)?)?)?)?)?)?\b/i;
