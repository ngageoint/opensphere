goog.provide('os.url.UrlEvent');
goog.require('goog.events.Event');
goog.require('os.url.EventType');



/**
 * @extends {goog.events.Event}
 * @constructor
 * @param {Object} params The parameters for the url import
 * @param {Object=} opt_target
 * Reference to the object that is the target of this event
 */
os.url.UrlEvent = function(params, opt_target) {
  os.url.UrlEvent.base(this, 'constructor', os.url.EventType.URL_IMPORTED, opt_target);
  this.params_ = params;
};
goog.inherits(os.url.UrlEvent, goog.events.Event);


/**
 * @private
 * @type {Object}
 */
os.url.UrlEvent.prototype.params_ = null;


/**
 * @return {Object}
 */
os.url.UrlEvent.prototype.getParams = function() {
  return this.params_;
};
