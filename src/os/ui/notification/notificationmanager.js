goog.provide('os.ui.notification.NotificationManager');

goog.require('goog.Promise');
goog.require('goog.Timer');



/**
 * @constructor
 */
os.ui.notification.NotificationManager = function() {
  /**
   * @type {string}
   * @private
   */
  this.appTitle_ = '';

  /**
   * Speed at which to blink the tab, in milliseconds
   * @type {!number}
   * @private
   */
  this.blinkSpeed_ = 750;

  /**
   * The number to display in the window title to indicate changes
   * @type {number}
   * @private
   */
  this.count_ = 0;

  /**
   * Time indicator when blinking notifications started; used to determine timeout
   * @type {number}
   * @private
   */
  this.blinkStarted_ = -1;

  /**
   * Timer to handle page title blinking.
   * @type {goog.Timer}
   * @private
   */
  this.blinkTimer_ = null;

  /**
   * Increments at each blink; used to toggle title strings as blinking occurs.
   * @type {number}
   * @private
   */
  this.blinkTickCount_ = 0;

  /**
   * How long to blink before expiring
   * @type {number}
   * @private
   */
  this.blinkDuration_ = 0;

  /**
   * Message to alternate with the application title
   * @type {string}
   * @private
   */
  this.blinkMessage_ = 'Updated!';

  /**
   * Callback to fire when blinking stops
   * @type {?function()}
   * @private
   */
  this.onStop_ = null;

  /**
   * Document mouseover listen key.
   * @type {goog.events.Key}
   * @private
   */
  this.listenKey_ = null;

  /**
   * Key to use to access the browser's visibility API.
   * @type {?string}
   * @private
   */
  this.browserHiddenKey_ = null;
  if (typeof document['hidden'] !== 'undefined') {
    this.browserHiddenKey_ = 'hidden';
  } else if (typeof document['mozHidden'] !== 'undefined') {
    this.browserHiddenKey_ = 'mozHidden';
  } else if (typeof document['webkitHidden'] !== 'undefined') {
    this.browserHiddenKey_ = 'webkitHidden';
  } else if (typeof document['msHidden'] !== 'undefined') {
    this.browserHiddenKey_ = 'msHidden';
  }
};
goog.addSingletonGetter(os.ui.notification.NotificationManager);


/**
 * Get the title for the notification manager.
 * @return {string}
 */
os.ui.notification.NotificationManager.prototype.getAppTitle = function() {
  return this.appTitle_;
};


/**
 * Set the title for the notification manager.
 * @param {string} value The new title
 */
os.ui.notification.NotificationManager.prototype.setAppTitle = function(value) {
  this.appTitle_ = value;
  this.reset_();
};


/**
 * Use browser visibility API to determine if the document is currently hidden.
 * @return {?boolean} If hidden is supported by browser, return true of false; otherwise null
 */
os.ui.notification.NotificationManager.prototype.getHidden = function() {
  var hidden = null;
  if (this.browserHiddenKey_ !== null) {
    hidden = document[this.browserHiddenKey_];
  }
  return hidden;
};


/**
 * Show a notification using the browser notification API, if available.
 * @param {!string} title
 * @param {NotificationOptions=} opt_options The same options as indicated by <code>Notification</code> API.
 * @return {!goog.Promise} Promise which will resolve with the <code>Notification</code>.  Clients can manipulate the
 *   notification directly: close it, add event handlers to it, etc.  The promise will be rejected if notifications
 *   fail, either because it's not supported in the browser or the user has disabled the feature, in which case
 *   the client may choose to use {@link os.ui.notification.NotificationManager#blink} instead.
 */
os.ui.notification.NotificationManager.prototype.notify = function(title, opt_options) {
  if ('Notification' in window && Notification.permission !== 'denied') {
    return this.createNotification_(title, opt_options);
  } else {
    var promise = new goog.Promise(function(resolve, reject) {
      // Reject the promise, letting the client know the notification failed
      reject();
    }, this);
    return promise;
  }
};


/**
 * Create a notification and provide the result via the resolve function in a {@link goog.Promise}
 * @param {!string} title
 * @param {NotificationOptions=} opt_options
 * @return {!goog.Promise}
 * @private
 */
os.ui.notification.NotificationManager.prototype.createNotification_ = function(title, opt_options) {
  var promise = new goog.Promise(function(resolve, reject) {
    if (Notification.permission === 'granted') {
      // create the notification and pass it back in the resolve promise function
      var notification = new Notification(title, opt_options);
      resolve(notification);
    } else {
      // Get permission, then call this function again
      this.requestPermissionAndCreateNotification_(title, resolve, reject, opt_options);
    }
  }, this);
  return promise;
};


/**
 * Request permission from the browser to create a notification.
 * @param {!string} title
 * @param {function(*)} resolve
 * @param {function()} reject
 * @param {NotificationOptions=} opt_options The same options as indicated by <code>Notification</code> API.
 * @private
 */
os.ui.notification.NotificationManager.prototype.requestPermissionAndCreateNotification_ =
    function(title, resolve, reject, opt_options) {
      Notification.requestPermission(goog.bind(function(permission) {
        if (permission === 'granted') {
          // create the notification and pass it back in the resolve promise function
          var notification = new Notification(title, opt_options);
          resolve(notification);
        } else {
          // Reject the promise, letting the client know the notification failed.
          reject();
        }
      }, this));
    };


/**
 * Bring the user's attention to this tab by blinking its title.  Registers listeners to stop blinking when the user
 * starts interacting. Use this sparingly as it's intended to interrupt their workflow.
 * @param {number=} opt_duration How long to continue the blinking before we give up and return to normal.  A number
 *  less than one means forever, which is the default.
 * @param {string=} opt_message Message to display as it blinks.  Defaults to a generic updating message.
 * @param {function()=} opt_onstop Optional callback to fire when blinking stops
 */
os.ui.notification.NotificationManager.prototype.blink = function(opt_duration, opt_message, opt_onstop) {
  var message = opt_message || 'Updated!';
  if (this.blinkTimer_ && message != this.blinkMessage_) {
    // new message, so clean up and start a new timer
    this.reset_();
  }

  if (!this.blinkTimer_) {
    this.blinkTimer_ = new goog.Timer(this.blinkSpeed_);
    this.blinkTimer_.listen(goog.Timer.TICK, this.blinkTick_, false, this);

    this.blinkDuration_ = opt_duration || 0;
    this.blinkMessage_ = message;
    this.onStop_ = opt_onstop || null;

    this.blinkStarted_ = Date.now();
    this.blinkTimer_.start();
    this.blinkTimer_.dispatchTick();

    this.startOrContinueListeningForUserAction_();
  }
};


/**
 * Determine if blink is happening.
 * @return {boolean}
 */
os.ui.notification.NotificationManager.prototype.isBlinking = function() {
  return this.blinkTimer_ != null;
};


/**
 * Do one iteration of blinking.  Adjust the title and schedule the next iteration.
 * @private
 */
os.ui.notification.NotificationManager.prototype.blinkTick_ = function() {
  if (this.blinkDuration_ <= 0 || Date.now() - this.blinkStarted_ < this.blinkDuration_) {
    var title = (this.blinkTickCount_++ % 2 === 0) ? this.blinkMessage_ : this.appTitle_;
    this.applyTitle_(title);
  } else {
    this.reset_();
  }
};


/**
 * Increase the notification count in the title by one.  Engage the document to listen for user interaction.
 */
os.ui.notification.NotificationManager.prototype.increment = function() {
  this.count_++;

  var title = '(' + this.count_ + ') ' + this.appTitle_;
  this.applyTitle_(title);

  this.startOrContinueListeningForUserAction_();
};


/**
 * Change the document title.
 * @param {string} title The title to display
 * @private
 */
os.ui.notification.NotificationManager.prototype.applyTitle_ = function(title) {
  goog.dom.getDocument().title = title;
};


/**
 * Reset notifications and reset the tab to a normal state.
 * @private
 */
os.ui.notification.NotificationManager.prototype.reset_ = function() {
  goog.dispose(this.blinkTimer_);
  this.blinkTimer_ = null;

  this.blinkTickCount_ = 0;
  this.count_ = 0;
  this.applyTitle_(this.appTitle_);

  if (this.listenKey_) {
    goog.events.unlistenByKey(this.listenKey_);
    this.listenKey_ = null;
  }

  if (this.onStop_) {
    this.onStop_();
    this.onStop_ = null;
  }
};


/**
 * Engage the document to listen for user interaction if it is not already.
 * @private
 */
os.ui.notification.NotificationManager.prototype.startOrContinueListeningForUserAction_ = function() {
  if (!this.listenKey_) {
    this.listenKey_ = goog.events.listen(goog.dom.getDocument(), goog.events.EventType.CLICK, this.reset_, false,
        this);
  }
};
