goog.provide('os.storage');

goog.require('goog.async.ConditionalDelay');
goog.require('os.defines');
goog.require('os.events.EventType');


/**
 * @define {string} Shared IndexedDB object store.
 */
goog.define('os.SHARED_STORE_NAME', 'shared');


/**
 * @define {string} Shared IndexedDB object store.
 */
goog.define('os.SHARED_DB_NAME', os.NAMESPACE + '.shared');


/**
 * Clears settings and reloads the page unless the application has registered a listener on {@link os.dispatcher} for
 * {@link os.events.EventType.RESET}. Register a listener if any asynchronous operations need to be performed before
 * page reload, like clearing data from IndexedDB. Async operations will be prone to failure if executed in the page
 * beforeunload event.
 *
 * @param {boolean=} opt_manualReload If the page will be manually reloaded. This is intended for use by Protractor.
 */
os.storage.clearStorage = function(opt_manualReload) {
  // reset application settings
  os.settings.reset().then(
      goog.partial(os.storage.resetInternal_, opt_manualReload),
      os.storage.reloadPage_);
};
goog.exportProperty(window, 'cls', os.storage.clearStorage);


/**
 * Fires application reset handlers if present, otherwise reloads the page.
 * @param {boolean=} opt_manualReload If the page will be manually reloaded. This is intended for use by Protractor.
 * @private
 */
os.storage.resetInternal_ = function(opt_manualReload) {
  // clear local storage
  window.localStorage.clear();
  var appName = os.config.appNs;
  localStorage.setItem('resetDate', appName + ' ' + new Date().toISOString());

  if (os.dispatcher.hasListener(os.events.EventType.RESET)) {
    // if a listener has been registered, fire the reset event
    os.dispatcher.dispatchEvent(os.events.EventType.RESET);

    if (!opt_manualReload) {
      var delay = new goog.async.ConditionalDelay(os.storage.canReset_);

      // wait for listeners to do their reset operations, then save settings and reload the page
      delay.onSuccess = os.storage.saveAndReload_;
      delay.onFailure = os.storage.saveAndReload_;

      // try to reset every 100ms, time out (and reset) after 5 seconds
      delay.start(100, 5000);
    }
  } else if (!opt_manualReload) {
    // otherwise just reload the page
    os.storage.reloadPage_();
  }
};


/**
 * Increment the application reset task counter.
 */
os.storage.incrementResetTasks = function() {
  os.storage.pendingResetTasks_++;
};


/**
 * Decrement the application reset task counter.
 */
os.storage.decrementResetTasks = function() {
  os.storage.pendingResetTasks_--;
};


/**
 * The number of pending tasks to complete before resetting the application.
 * @type {number}
 * @private
 */
os.storage.pendingResetTasks_ = 0;


/**
 * Check if all pending reset tasks have completed.
 * @return {boolean}
 * @private
 */
os.storage.canReset_ = function() {
  return os.storage.pendingResetTasks_ <= 0;
};


/**
 * Save final settings and reload the page.
 * @private
 */
os.storage.saveAndReload_ = function() {
  os.settings.save().then(os.storage.reloadPage_, os.storage.reloadPage_);
};


/**
 * Disable any further modification of settings and reload the page.
 * @private
 */
os.storage.reloadPage_ = function() {
  os.settings.setPersistenceEnabled(false);
  window.location.reload(true);
};

