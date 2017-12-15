goog.provide('os.net.RequestEvent');
goog.provide('os.net.RequestEventType');

goog.require('goog.events.Event');


/**
 * @enum {string}
 */
os.net.RequestEventType = {
  TRY_URL: 'tryUrl',
  USER_URL: 'userUrl'
};



/**
 * @param {!string} type
 * @param {!string} url
 * @constructor
 * @extends {goog.events.Event}
 */
os.net.RequestEvent = function(type, url) {
  os.net.RequestEvent.base(this, 'constructor', type);

  /**
   * @type {!string}
   */
  this.url = url;
};
goog.inherits(os.net.RequestEvent, goog.events.Event);
