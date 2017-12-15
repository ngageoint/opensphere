goog.provide('os.im.mapping.location.BaseLonMapping');
goog.require('os.im.mapping.location.BaseLatMapping');



/**
 * @extends {os.im.mapping.location.BaseLatMapping}
 * @constructor
 */
os.im.mapping.location.BaseLonMapping = function() {
  os.im.mapping.location.BaseLonMapping.base(this, 'constructor');
  this.coordField = 'LON';
  this.type = os.im.mapping.location.BaseLonMapping.ID;
  this.regex = os.im.mapping.location.BaseLonMapping.LON_REGEX;
};
goog.inherits(os.im.mapping.location.BaseLonMapping, os.im.mapping.location.BaseLatMapping);


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
