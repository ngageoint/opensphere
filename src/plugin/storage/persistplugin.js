goog.provide('plugin.storage.PersistPlugin');


goog.require('goog.labs.userAgent.browser');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.plugin.AbstractPlugin');



/**
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.storage.PersistPlugin = function() {
  plugin.storage.PersistPlugin.base(this, 'constructor');
  this.id = plugin.storage.PersistPlugin.ID;
};
goog.inherits(plugin.storage.PersistPlugin, os.plugin.AbstractPlugin);
goog.addSingletonGetter(plugin.storage.PersistPlugin);


/**
 * @type {string}
 * @const
 */
plugin.storage.PersistPlugin.ID = 'persist';


/**
 * The logger.
 * @const
 * @type {goog.debug.Logger}
 * @private
 */
plugin.storage.PersistPlugin.LOGGER_ = goog.log.getLogger('plugin.storage.PersistPlugin');


/**
 * @inheritDoc
 */
plugin.storage.PersistPlugin.prototype.init = function() {
  if (navigator.storage && navigator.storage.persist) {
    var scope = this;
    navigator.storage.persisted().then(function(result) {
      if (!result) {
        navigator.storage.persist().then(function(userDecision) {
          if (!userDecision) {
            var extra = '';
            if (window.isSecureContext === false) {
              extra += '<p>The application is not being served in a secure context, and thus persistent storage ' +
                  'may be automatically declined.</p>';
            }

            if (goog.labs.userAgent.browser.isChrome()) {
              extra += '<p>Chrome automatically manages the persistent storage permission based on the following ' +
                'criteria (<a href="https://developers.google.com/web/updates/2016/06/persistent-storage" ' +
                'target="_blank">source</a>):' +
                '<ul><li>The site is bookmarked (and the user has 5 or less bookmarks)</li>' +
                '<li>The site has high site engagement [not quantified]</li>' +
                '<li>The site has been added to home screen</li>' +
                '<li>The site has push notifications enabled</li><ul> Try bookmarking the application.</p>';
            }

            scope.log('By declining persistent data, your application settings may be reset ' +
                'when under storage pressure.' + extra);
          } else {
            goog.log.info(plugin.storage.PersistPlugin.LOGGER_, 'Storage is persistent');
          }
        });
      } else {
        goog.log.info(plugin.storage.PersistPlugin.LOGGER_, 'Storage is persistent');
      }
    });
  } else {
    this.log('This browser does not support persistent storage. Your application settings may be ' +
        'reset when under storage pressure.');
  }
};


/**
 * @param {string} msg The message to log
 * @protected
 */
plugin.storage.PersistPlugin.prototype.log = function(msg) {
  goog.log.warning(plugin.storage.PersistPlugin.LOGGER_, msg);
  os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.WARNING);
};
