goog.module('os.net.LongPoll');
goog.module.declareLegacyNamespace();

const Timer = goog.require('goog.Timer');
const Uri = goog.require('goog.Uri');
const {assert, fail} = goog.require('goog.asserts');
const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const EventType = goog.require('goog.net.EventType');
const WebSocket = goog.require('goog.net.WebSocket');
const XhrIo = goog.require('goog.net.XhrIo');
const ReadyState = goog.require('goog.net.XmlHttp.ReadyState');

const Logger = goog.requireType('goog.log.Logger');


/**
 * Long-poll streaming is the process of opening an HTTP request for as long as possible
 * (30 seconds being the longest allowed by most browsers) and process data as it comes in
 * (READY_STATE_CHANGE fires for every update) rather than on SUCCESS/COMPLETE.
 *
 * This long-poll implementation is specifically designed to mimic `WebSocket`. If
 * WebSocket is supported by the remote server, use that instead.
 *
 *  the next reconnect based on the given attempt count.
 * @suppress {accessControls}
 */
class LongPoll extends EventTarget {
  /**
   * Constructor.
   * @param {boolean=} opt_autoReconnect Defaults to true
   * @param {function(number):number=} opt_getNextReconnect A function that returns the time until
   */
  constructor(opt_autoReconnect, opt_getNextReconnect) {
    super();

    /**
     * True if the web socket should automatically reconnect or not.
     * @type {boolean}
     * @private
     */
    this.autoReconnect_ = opt_autoReconnect !== undefined ? opt_autoReconnect : true;

    /**
     * A function for obtaining the time until the next reconnect attempt.
     * Given the reconnect attempt count (which is a positive integer), the
     * function should return a positive integer representing the milliseconds to
     * the next reconnect attempt.
     * @type {function(number):number}
     * @private
     */
    this.getNextReconnect_ = opt_getNextReconnect || WebSocket.EXPONENTIAL_BACKOFF_;

    /**
     * The time, in milliseconds, that must elapse before the next attempt to
     * reconnect.
     * @type {number}
     * @private
     */
    this.nextReconnect_ = this.getNextReconnect_(this.reconnectAttempt_);

    /**
     * The current position within the stream
     * @type {number}
     * @private
     */
    this.pos_ = 0;
  }

  /**
   * Creates and opens the actual request. Only call this after attaching the appropriate
   * listeners to this object. If listeners aren't registered, then the `WebSocket.EventType.OPENED`
   * event might be missed.
   *
   * @param {string} url The URL to which to connect.
   * @param {string=} opt_protocol Used by WebSocket. Not used by stream.
   */
  open(url, opt_protocol) {
    // Don't do anything if the request is already open
    assert(!this.isOpen(), 'The stream is already open');

    // Clear any pending attempts to reconnect.
    this.clearReconnectTimer_();

    // Construct the stream
    this.url = url;

    if (!this.polling_) {
      log.info(this.logger, 'Opening stream on ' + this.url);
    } else {
      log.fine(this.logger, 'New poll to ' + this.url);
    }

    this.xhr_ = new XhrIo();

    // register the event handlers
    this.xhr_.listen(EventType.READY_STATE_CHANGE, this.onState, false, this);
    this.xhr_.listen(EventType.SUCCESS, this.onClose, false, this);
    this.xhr_.listen(EventType.ERROR, this.onClose, false, this);
    this.xhr_.listen(EventType.ABORT, this.onClose, false, this);

    this.xhr_.setWithCredentials(LongPoll.isExternal_(this.url));

    this.pos_ = 0;
    this.xhr_.send(this.url);
  }

  /**
   * Closes the stream
   */
  close() {
    // Clear any pending attempts to reconnect
    this.clearReconnectTimer_();

    // Attempt to close only if the stream was created
    if (this.xhr_ && this.xhr_.isActive()) {
      log.info(this.logger, 'Closing the stream.');

      // Close is expected here since it was a direct  call. Close is considered
      // unexpected when opening the connection fails or there is some other form
      // of connection loss after being connected.
      this.closeExpected_ = true;
      this.xhr_.abort();
    }
  }

  /**
   * Send is a no-op for long poll streaming since this is a one-way connection (download only)
   *
   * @param {string} message
   */
  send(message) {
    fail('Cannot send messages on a one-way stream');
  }

  /**
   * Checks to see if the stream is connected or not.
   *
   * Note that this can return false in the time between poll requests
   *
   * @return {boolean} True if the stream is open, false otherwise
   */
  isOpen() {
    return !!this.xhr_ && this.xhr_.isActive() && !this.xhr_.isComplete();
  }

  /**
   * Called when readystate changes on the request
   *
   * @protected
   */
  onState() {
    switch (this.xhr_.getReadyState()) {
      case ReadyState.LOADING:
        if (!this.polling_) {
          this.onOpen();
          this.polling_ = false;
        }
        break;
      case ReadyState.INTERACTIVE:
      case ReadyState.COMPLETE:
        var msg = this.getMessage();

        if (msg) {
          this.dispatchEvent(new WebSocket.MessageEvent(msg));
        }
        break;
      default: break;
    }
  }

  /**
   * Called when the stream has connected
   *
   * @protected
   */
  onOpen() {
    log.info(this.logger, 'Stream connected on ' + this.url);
    this.dispatchEvent(WebSocket.EventType.OPENED);

    // Set the next reconnect interval
    this.reconnectAttempt_ = 0;
    this.nextReconnect_ = this.getNextReconnect_(this.reconnectAttempt_);
  }

  /**
   * Called when the stream has closed
   *
   * @param {goog.events.Event} e
   * @param {boolean=} opt_normal
   * @protected
   */
  onClose(e, opt_normal) {
    // always clear out the request on a close
    if (this.xhr_) {
      this.xhr_.dispose();
      this.xhr_ = null;
    }

    if (e.type == EventType.SUCCESS) {
      // poll completed, so open it again
      if (this.url) {
        this.polling_ = true;
        this.open(this.url);
      }
    } else {
      this.dispatchEvent(WebSocket.EventType.CLOSED);

      // see if this was an expected onClose call
      if (this.closeExpected_ || opt_normal) {
        log.info(this.logger, 'Stream closed normally');

        // Only clear out the URL if this is a normal close
        this.url = null;
      } else {
        // unexpected, so try to reconnect
        log.error(this.logger, 'The stream disconnected unexpectedly!');

        // Only try to reconnect if it is enabled
        if (this.autoReconnect_) {
          //  log the reconnect attempt
          var seconds = Math.floor(this.nextReconnect_ / 1000);
          log.info(this.logger, 'Seconds until next reconnect attempt: ' + seconds);

          // Actually schedule the timer
          this.reconnectTimer_ = Timer.callOnce(this.open.bind(this, /** @type {!string} */ (this.url)),
              this.nextReconnect_, this);

          // set the next reconnect interval
          this.reconnectAttempt_++;
          this.nextReconnect_ = this.getNextReconnect_(this.reconnectAttempt_);
        }
      }
    }

    this.closeExpected_ = false;
  }

  /**
   * Retrieves the last message from the stream
   *
   * @protected
   * @return {?string} The last message, if one exists
   */
  getMessage() {
    var msg = null;
    var str = this.xhr_.getResponse();

    if (str) {
      msg = str.substring(this.pos_);
      this.pos_ = str.length;
    }

    return msg;
  }

  /**
   * Retrieves the status code from the xhr.
   *
   * @return {?number} The status code or null if inactive
   */
  getStatus() {
    return this.xhr_ ? this.xhr_.getStatus() : null;
  }

  /**
   * Clears the reconnect timer.
   *
   * @private
   */
  clearReconnectTimer_() {
    if (this.reconnectTimer_ != null) {
      Timer.clear(this.reconnectTimer_);
    }
    this.reconnectTimer_ = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.close();
  }

  /**
   * @param {!(string|Uri)} uri
   * @param {(string|goog.Uri)=} opt_localUri
   * @return {boolean} True if the url is external, false otherwise
   * @private
   */
  static isExternal_(uri, opt_localUri) {
    uri = typeof uri === 'string' ? new Uri(uri) : uri;
    opt_localUri = opt_localUri ?
      typeof opt_localUri === 'string' ? new Uri(opt_localUri) : opt_localUri :
      new Uri(window.location);

    return !uri.hasSameDomainAs(opt_localUri);
  }
}

/**
 * The request object used to do the streaming
 * @type {XhrIo}
 * @private
 */
LongPoll.prototype.xhr_ = null;


/**
 * The URL to which the stream will connect.
 * @type {?string}
 * @protected
 */
LongPoll.prototype.url = null;


/**
 * True if a call to the close callback is expected or not.
 * @type {boolean}
 * @private
 */
LongPoll.prototype.closeExpected_ = false;


/**
 * True if we are about to re-open due to poll
 * @type {boolean}
 * @private
 */
LongPoll.prototype.polling_ = false;


/**
 * Keeps track of the number of reconnect attempts made since the last
 * successful connection.
 * @type {number}
 * @private
 */
LongPoll.prototype.reconnectAttempt_ = 0;


/**
 * Identifier for the {@link goog.Timer} used for reconnect.
 * @type {?number}
 * @private
 */
LongPoll.prototype.reconnectTimer_ = null;


/**
 * The logger for this class.
 * @type {Logger}
 * @protected
 */
LongPoll.prototype.logger = log.getLogger('os.net.LongPoll');


exports = LongPoll;
