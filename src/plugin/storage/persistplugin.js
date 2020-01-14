goog.module('plugin.storage.PersistPlugin');
goog.module.declareLegacyNamespace();

const browser = goog.require('goog.labs.userAgent.browser');
const log = goog.require('goog.log');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');

const LOGGER_ = log.getLogger('PersistPlugin');


/**
 * Plugin to check for persistent storage and ask the user
 * to give permission for persistent storage.
 */
class PersistPlugin extends AbstractPlugin {
  /**
   */
  constructor() {
    super();
    this.id = 'persist';
  }

  /**
   * @inheritDoc
   */
  init() {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persisted().then((result) => {
        if (!result) {
          navigator.storage.persist().then((userDecision) => {
            if (!userDecision) {
              var extra = '';
              if (window.isSecureContext === false) {
                extra += '<p>The application is not being served in a secure context, and thus persistent storage ' +
                    'may be automatically declined.</p>';
              }

              if (browser.isChrome()) {
                extra += '<p>Chrome automatically manages the persistent storage permission based on the following ' +
                  'criteria (<a href="https://developers.google.com/web/updates/2016/06/persistent-storage" ' +
                  'target="_blank">source</a>):' +
                  '<ul><li>The site is bookmarked (and the user has 5 or less bookmarks)</li>' +
                  '<li>The site has high site engagement [not quantified]</li>' +
                  '<li>The site has been added to home screen</li>' +
                  '<li>The site has push notifications enabled</li><ul> Try bookmarking the application.</p>';
              }

              this.log('By declining persistent data, your application settings may be automatically reset ' +
                  'when under storage pressure.' + extra);
            } else {
              log.info(LOGGER_, 'Storage is persistent');
            }
          });
        } else {
          log.info(LOGGER_, 'Storage is persistent');
        }
      });
    } else {
      this.log('This browser does not support persistent storage. Your application settings may be ' +
          'automatically reset when under storage pressure.');
    }
  }


  /**
   * @param {string} msg The message to log
   * @protected
   */
  log(msg) {
    log.warning(LOGGER_, msg);
    os.alertManager.sendAlert(msg, AlertEventSeverity.WARNING);
  }
}

exports = PersistPlugin;
