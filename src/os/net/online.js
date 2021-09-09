goog.module('os.net.Online');

const EventTarget = goog.require('goog.events.EventTarget');
const dispatcher = goog.require('os.Dispatcher');
const OnlineEventType = goog.require('os.net.OnlineEventType');


/**
 * Check for online status
 * If status is false, there is no network connection (good to know)
 * If status is true, the browser is reporting that the OS is connected to a local network (not the same as internet)
 */
class Online extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();
    /**
     * @type {boolean}
     * @private
     */
    this.status_ = false;

    this.init();
  }

  /**
   * setup
   */
  init() {
    this.status_ = navigator.onLine;
    window.addEventListener('online', this.fireEvent_.bind(this));
    window.addEventListener('offline', this.fireEvent_.bind(this));
  }

  /**
   * @param {Event} e
   * @private
   */
  fireEvent_(e) {
    if (e && e.type == 'online') {
      this.status_ = true;
      dispatcher.getInstance().dispatchEvent(OnlineEventType.ONLINE);
    } else if (e.type == 'offline') {
      this.status_ = false;
      dispatcher.getInstance().dispatchEvent(OnlineEventType.OFFLINE);
    }
  }

  /**
   * @return {boolean}
   */
  getStatus() {
    return this.status_;
  }

  /**
   * Get the most up to date status
   *
   * @return {boolean}
   */
  refreshStatus() {
    var newVal = navigator.onLine;

    // if the newVal is different from the one we have been tracking, send the event
    if (this.status_ != newVal) {
      var type = newVal ? 'online' : 'offline';
      var e = new Event(type);
      this.fireEvent_(e);
    }

    this.status_ = newVal;
    return this.status_;
  }

  /**
   * Get the global instance.
   * @return {!Online}
   */
  static getInstance() {
    if (!instance) {
      instance = new Online();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {Online} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {Online|undefined}
 */
let instance;

exports = Online;
