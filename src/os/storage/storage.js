goog.module('os.storage');

const ConditionalDelay = goog.require('goog.async.ConditionalDelay');
const dispatcher = goog.require('os.Dispatcher');
const osConfig = goog.require('os.config');
const {getSettings} = goog.require('os.config.instance');
const EventType = goog.require('os.events.EventType');

const Promise = goog.requireType('goog.Promise');


/**
 * Clears settings and reloads the page unless the application has registered a listener on {@link dispatcher} for
 * {@link EventType.RESET}. Register a listener if any asynchronous operations need to be performed before
 * page reload, like clearing data from IndexedDB. Async operations will be prone to failure if executed in the page
 * beforeunload event.
 *
 * @param {boolean=} opt_manualReload If the page will be manually reloaded. This is intended for use by Protractor.
 * @return {!Promise}
 */
const clearStorage = function(opt_manualReload) {
  // reset application settings
  return getSettings().reset().then(() => {
    resetInternal(opt_manualReload);
  }, reloadPage);
};
goog.exportSymbol('cls', clearStorage);

/**
 * Fires application reset handlers if present, otherwise reloads the page.
 *
 * @param {boolean=} opt_manualReload If the page will be manually reloaded. This is intended for use by Protractor.
 */
const resetInternal = function(opt_manualReload) {
  // clear local storage
  window.localStorage.clear();
  var appName = osConfig.appNs;
  localStorage.setItem('resetDate', appName + ' ' + new Date().toISOString());

  if (dispatcher.getInstance().hasListener(EventType.RESET)) {
    // if a listener has been registered, fire the reset event
    dispatcher.getInstance().dispatchEvent(EventType.RESET);

    if (!opt_manualReload) {
      var delay = new ConditionalDelay(canReset);

      // wait for listeners to do their reset operations, then save settings and reload the page
      delay.onSuccess = saveAndReload;
      delay.onFailure = saveAndReload;

      // try to reset every 100ms, time out (and reset) after 5 seconds
      delay.start(100, 5000);
    }
  } else if (!opt_manualReload) {
    // otherwise just reload the page
    reloadPage();
  }
};

/**
 * The number of pending tasks to complete before resetting the application.
 * @type {number}
 */
let pendingResetTasks = 0;

/**
 * Increment the application reset task counter.
 */
const incrementResetTasks = function() {
  pendingResetTasks++;
};

/**
 * Decrement the application reset task counter.
 */
const decrementResetTasks = function() {
  pendingResetTasks--;
};

/**
 * Check if all pending reset tasks have completed.
 *
 * @return {boolean}
 */
const canReset = function() {
  return pendingResetTasks <= 0;
};

/**
 * Save final settings and reload the page.
 */
const saveAndReload = function() {
  getSettings().save().then(reloadPage, reloadPage);
};

/**
 * Disable any further modification of settings and reload the page.
 *
 */
const reloadPage = function() {
  getSettings().setPersistenceEnabled(false);
  window.location.reload(true);
};

exports = {
  clearStorage,
  incrementResetTasks,
  decrementResetTasks
};
