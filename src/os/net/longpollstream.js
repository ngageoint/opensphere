goog.provide('os.net.LongPoll');
goog.require('goog.Uri');
goog.require('goog.asserts');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.net.EventType');
goog.require('goog.net.WebSocket');
goog.require('goog.net.XhrIo');
goog.require('goog.net.XmlHttp.ReadyState');



/**
 * Long-poll streaming is the process of opening an HTTP request for as long as possible
 * (30 seconds being the longest allowed by most browsers) and process data as it comes in
 * (READY_STATE_CHANGE fires for every update) rather than on SUCCESS/COMPLETE.
 *
 * This long-poll implementation is specifically designed to mimic `goog.net.WebSocket`. If
 * WebSocket is supported by the remote server, use that instead.
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {boolean=} opt_autoReconnect Defaults to true
 * @param {function(number):number=} opt_getNextReconnect A function that returns the time until
 *  the next reconnect based on the given attempt count.
 * @suppress {accessControls}
 */
os.net.LongPoll = function(opt_autoReconnect, opt_getNextReconnect) {
  os.net.LongPoll.base(this, 'constructor');

  /**
   * True if the web socket should automatically reconnect or not.
   * @type {boolean}
   * @private
   */
  this.autoReconnect_ = goog.isDef(opt_autoReconnect) ? opt_autoReconnect : true;

  /**
   * A function for obtaining the time until the next reconnect attempt.
   * Given the reconnect attempt count (which is a positive integer), the
   * function should return a positive integer representing the milliseconds to
   * the next reconnect attempt.
   * @type {function(number):number}
   * @private
   */
  this.getNextReconnect_ = opt_getNextReconnect || goog.net.WebSocket.EXPONENTIAL_BACKOFF_;

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
};
goog.inherits(os.net.LongPoll, goog.events.EventTarget);


/**
 * The request object used to do the streaming
 * @type {goog.net.XhrIo}
 * @private
 */
os.net.LongPoll.prototype.xhr_ = null;


/**
 * The URL to which the stream will connect.
 * @type {?string}
 * @protected
 */
os.net.LongPoll.prototype.url = null;


/**
 * True if a call to the close callback is expected or not.
 * @type {boolean}
 * @private
 */
os.net.LongPoll.prototype.closeExpected_ = false;


/**
 * True if we are about to re-open due to poll
 * @type {boolean}
 * @private
 */
os.net.LongPoll.prototype.polling_ = false;


/**
 * Keeps track of the number of reconnect attempts made since the last
 * successful connection.
 * @type {number}
 * @private
 */
os.net.LongPoll.prototype.reconnectAttempt_ = 0;


/**
 * Identifier for the {@link goog.Timer} used for reconnect.
 * @type {?number}
 * @private
 */
os.net.LongPoll.prototype.reconnectTimer_ = null;


/**
 * The logger for this class.
 * @type {goog.log.Logger}
 * @protected
 */
os.net.LongPoll.prototype.logger = goog.log.getLogger('os.net.LongPoll');


/**
 * Creates and opens the actual request. Only call this after attaching the appropriate
 * listeners to this object. If listeners aren't registered, then the `goog.net.WebSocket.EventType.OPENED`
 * event might be missed.
 *
 * @param {string} url The URL to which to connect.
 * @param {string=} opt_protocol Used by WebSocket. Not used by stream.
 */
os.net.LongPoll.prototype.open = function(url, opt_protocol) {
  // Don't do anything if the request is already open
  goog.asserts.assert(!this.isOpen(), 'The stream is already open');

  // Clear any pending attempts to reconnect.
  this.clearReconnectTimer_();

  // Construct the stream
  this.url = url;

  if (!this.polling_) {
    goog.log.info(this.logger, 'Opening stream on ' + this.url);
  } else {
    goog.log.fine(this.logger, 'New poll to ' + this.url);
  }

  this.xhr_ = new goog.net.XhrIo();

  // register the event handlers
  this.xhr_.listen(goog.net.EventType.READY_STATE_CHANGE, this.onState, false, this);
  this.xhr_.listen(goog.net.EventType.SUCCESS, this.onClose, false, this);
  this.xhr_.listen(goog.net.EventType.ERROR, this.onClose, false, this);
  this.xhr_.listen(goog.net.EventType.ABORT, this.onClose, false, this);

  this.xhr_.setWithCredentials(os.net.LongPoll.isExternal_(this.url));

  this.pos_ = 0;
  this.xhr_.send(this.url);
};


/**
 * @param {!(string|goog.Uri)} uri
 * @param {(string|goog.Uri)=} opt_localUri
 * @return {boolean} True if the url is external, false otherwise
 * @private
 */
os.net.LongPoll.isExternal_ = function(uri, opt_localUri) {
  uri = goog.isString(uri) ? new goog.Uri(uri) : uri;
  opt_localUri = opt_localUri ?
      goog.isString(opt_localUri) ? new goog.Uri(opt_localUri) : opt_localUri :
      new goog.Uri(window.location);

  return !uri.hasSameDomainAs(opt_localUri);
};


/**
 * Closes the stream
 */
os.net.LongPoll.prototype.close = function() {
  // Clear any pending attempts to reconnect
  this.clearReconnectTimer_();

  // Attempt to close only if the stream was created
  if (this.xhr_ && this.xhr_.isActive()) {
    goog.log.info(this.logger, 'Closing the stream.');

    // Close is expected here since it was a direct  call. Close is considered
    // unexpected when opening the connection fails or there is some other form
    // of connection loss after being connected.
    this.closeExpected_ = true;
    this.xhr_.abort();
  }
};


/**
 * Send is a no-op for long poll streaming since this is a one-way connection (download only)
 * @param {string} message
 */
os.net.LongPoll.prototype.send = function(message) {
  goog.asserts.fail('Cannot send messages on a one-way stream');
};


/**
 * Checks to see if the stream is connected or not.
 *
 * Note that this can return false in the time between poll requests
 *
 * @return {boolean} True if the stream is open, false otherwise
 */
os.net.LongPoll.prototype.isOpen = function() {
  return !!this.xhr_ && this.xhr_.isActive() && !this.xhr_.isComplete();
};


/**
 * Called when readystate changes on the request
 * @protected
 */
os.net.LongPoll.prototype.onState = function() {
  switch (this.xhr_.getReadyState()) {
    case goog.net.XmlHttp.ReadyState.LOADING:
      if (!this.polling_) {
        this.onOpen();
        this.polling_ = false;
      }
      break;
    case goog.net.XmlHttp.ReadyState.INTERACTIVE:
    case goog.net.XmlHttp.ReadyState.COMPLETE:
      var msg = this.getMessage();

      if (msg) {
        this.dispatchEvent(new goog.net.WebSocket.MessageEvent(msg));
      }
      break;
    default: break;
  }
};


/**
 * Called when the stream has connected
 * @protected
 */
os.net.LongPoll.prototype.onOpen = function() {
  goog.log.info(this.logger, 'Stream connected on ' + this.url);
  this.dispatchEvent(goog.net.WebSocket.EventType.OPENED);

  // Set the next reconnect interval
  this.reconnectAttempt_ = 0;
  this.nextReconnect_ = this.getNextReconnect_(this.reconnectAttempt_);
};


/**
 * Called when the stream has closed
 * @param {goog.events.Event} e
 * @param {boolean=} opt_normal
 * @protected
 */
os.net.LongPoll.prototype.onClose = function(e, opt_normal) {
  // always clear out the request on a close
  if (this.xhr_) {
    this.xhr_.dispose();
    this.xhr_ = null;
  }

  if (e.type == goog.net.EventType.SUCCESS) {
    // poll completed, so open it again
    if (this.url) {
      this.polling_ = true;
      this.open(this.url);
    }
  } else {
    this.dispatchEvent(goog.net.WebSocket.EventType.CLOSED);

    // see if this was an expected onClose call
    if (this.closeExpected_ || opt_normal) {
      goog.log.info(this.logger, 'Stream closed normally');

      // Only clear out the URL if this is a normal close
      this.url = null;
    } else {
      // unexpected, so try to reconnect
      goog.log.error(this.logger, 'The stream disconnected unexpectedly!');

      // Only try to reconnect if it is enabled
      if (this.autoReconnect_) {
        //  log the reconnect attempt
        var seconds = Math.floor(this.nextReconnect_ / 1000);
        goog.log.info(this.logger, 'Seconds until next reconnect attempt: ' + seconds);

        // Actually schedule the timer
        this.reconnectTimer_ = goog.Timer.callOnce(this.open.bind(this, /** @type {!string} */ (this.url)),
            this.nextReconnect_, this);

        // set the next reconnect interval
        this.reconnectAttempt_++;
        this.nextReconnect_ = this.getNextReconnect_(this.reconnectAttempt_);
      }
    }
  }

  this.closeExpected_ = false;
};


/**
 * Retrieves the last message from the stream
 *
 * @protected
 * @return {?string} The last message, if one exists
 */
os.net.LongPoll.prototype.getMessage = function() {
  var msg = null;
  var str = this.xhr_.getResponse();

  if (str) {
    msg = str.substring(this.pos_);
    this.pos_ = str.length;
  }

  return msg;
};


/**
 * Retrieves the status code from the xhr.
 *
 * @return {?number} The status code or null if inactive
 */
os.net.LongPoll.prototype.getStatus = function() {
  return this.xhr_ ? this.xhr_.getStatus() : null;
};


/**
 * Clears the reconnect timer.
 * @private
 */
os.net.LongPoll.prototype.clearReconnectTimer_ = function() {
  if (goog.isDefAndNotNull(this.reconnectTimer_)) {
    goog.Timer.clear(this.reconnectTimer_);
  }
  this.reconnectTimer_ = null;
};


/**
 * @inheritDoc
 */
os.net.LongPoll.prototype.disposeInternal = function() {
  os.net.LongPoll.base(this, 'disposeInternal');
  this.close();
};
