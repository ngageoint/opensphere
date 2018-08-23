goog.provide('os.net.Online');
goog.provide('os.net.OnlineEventType');

goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('os');



/**
 * @enum {string}
 */
os.net.OnlineEventType = {
  ONLINE: 'online',
  OFFLINE: 'offline'
};


/**
 * Check for online status
 * If status is false, there is no network connection (good to know)
 * If status is true, the browser is reporting that the OS is connected to a local network (not the same as internet)
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.net.Online = function() {
  os.net.Online.base(this, 'constructor');
  /**
   * @type {boolean}
   * @private
   */
  this.status_ = false;

  this.init();
};
goog.inherits(os.net.Online, goog.events.EventTarget);
goog.addSingletonGetter(os.net.Online);


/**
 * setup
 */
os.net.Online.prototype.init = function() {
  this.status_ = navigator.onLine;
  window.addEventListener('online', this.fireEvent_.bind(this));
  window.addEventListener('offline', this.fireEvent_.bind(this));
};


/**
 * @param {Event} e
 * @private
 */
os.net.Online.prototype.fireEvent_ = function(e) {
  if (e && e.type == 'online') {
    this.status_ = true;
    os.dispatcher.dispatchEvent(os.net.OnlineEventType.ONLINE);
  } else if (e.type == 'offline') {
    this.status_ = false;
    os.dispatcher.dispatchEvent(os.net.OnlineEventType.OFFLINE);
  }
};


/**
 * @return {boolean}
 */
os.net.Online.prototype.getStatus = function() {
  return this.status_;
};


/**
 * Get the most up to date status
 * @return {boolean}
 */
os.net.Online.prototype.refreshStatus = function() {
  var newVal = navigator.onLine;

  // if the newVal is different from the one we have been tracking, send the event
  if (this.status_ != newVal) {
    var type = newVal ? 'online' : 'offline';
    var e = new Event(type);
    this.fireEvent_(e);
  }

  this.status_ = newVal;
  return this.status_;
};
