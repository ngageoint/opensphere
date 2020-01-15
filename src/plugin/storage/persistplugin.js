goog.module('plugin.storage.PersistPlugin');
goog.module.declareLegacyNamespace();

const browser = goog.require('goog.labs.userAgent.browser');
const log = goog.require('goog.log');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const Metrics = goog.require('os.metrics.Metrics');
const {launchConfirm} = goog.require('os.ui.window');
const LOGGER_ = log.getLogger('PersistPlugin');

const PERSISTENCE_SUCCEEDED = 'storage.persistence.succeeded';
const PERSISTENCE_ACCEPTED = 'storage.persistence.accepted';
const PERSISTENCE_DECLINED = 'storage.persistence.declined';
const PERSISTENCE_FAILED = 'storage.persistence.failed';


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
    const msgs = [];
    const metrics = Metrics.getInstance();

    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persisted().then((result) => {
        if (!result) {
          navigator.storage.persist().then((userDecision) => {
            if (!userDecision) {
              msgs.length = 0;
              msgs.push('By declining persistent storage, your application settings may be automatically ' +
                'reset when under storage pressure (the conditions for that event are browser dependent).');
              this.log(msgs);
              metrics.updateMetric(PERSISTENCE_DECLINED, 1);
            } else {
              log.info(LOGGER_, 'User allowed (or browser automatically allowed) persistent storage');
              metrics.updateMetric(PERSISTENCE_ACCEPTED, 1);
              metrics.updateMetric(PERSISTENCE_SUCCEEDED, 1);
            }
          });
        } else {
          log.info(LOGGER_, 'Storage is persistent');
          metrics.updateMetric(PERSISTENCE_SUCCEEDED, 1);
        }
      });
    } else {
      if (window.isSecureContext === false) {
        msgs.push('The application is not being served in a secure context. Persistent storage permission ' +
            'will be automatically declined.');
      } else if (browser.isChrome()) {
        msgs.push('Chrome automatically manages the persistent storage permission based on the following ' +
          'criteria (<a href="https://developers.google.com/web/updates/2016/06/persistent-storage" ' +
          'target="_blank">source</a>):' +
          '<ul><li>The site is bookmarked (and the user has 5 or less bookmarks)</li>' +
          '<li>The site has high site engagement [not quantified]</li>' +
          '<li>The site has been added to home screen</li>' +
          '<li>The site has push notifications enabled</li></ul> Try bookmarking the application or ' +
            'allowing push notifications.');
      }

      msgs.push('Your application settings may be automatically reset when under storage pressure.');
      this.log(msgs);

      metrics.updateMetric(PERSISTENCE_FAILED, 1);
      launchPersistentStorageDialog('<p>' + msgs.join('</p><p>') + '</p>');
    }
  }


  /**
   * @param {string} msg The message to log
   * @protected
   */
  logOne(msg) {
    log.warning(LOGGER_, msg);
    os.alertManager.sendAlert(msg, AlertEventSeverity.WARNING);
  }

  /**
   * @param {Array<string>} msgs
   * @protected
   */
  log(msgs) {
    msgs.forEach(this.logOne);
  }
}


/**
 * @param {string} text
 */
const launchPersistentStorageDialog = (text) => {
  const scopeOptions = {
    'hideCancel': true
  };

  const windowOptions = {
    'label': 'Persistent Storage Not Supported',
    'headerClass': 'bg-warning u-bg-warning-text',
    'icon': 'fa fa-frown-o',
    'x': 'center',
    'y': 'center',
    'width': 525,
    'min-width': 300,
    'max-width': 1000,
    'height': 'auto',
    'min-height': 200,
    'max-height': 1000,
    'modal': true
  };

  launchConfirm(/** @type {!osx.window.ConfirmOptions} */ ({
    prompt: text,
    windowOptions: windowOptions
  }), scopeOptions);
};


exports = PersistPlugin;
