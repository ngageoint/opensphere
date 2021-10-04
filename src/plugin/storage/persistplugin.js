goog.declareModuleId('plugin.storage.PersistPlugin');

import AlertEventSeverity from '../../os/alert/alerteventseverity.js';
import alertManager from '../../os/alert/alertmanager.js';
import settings from '../../os/config/settings.js';
import Metrics from '../../os/metrics/metrics.js';
import AbstractPlugin from '../../os/plugin/abstractplugin.js';
import {launchConfirm} from '../../os/ui/window/confirm.js';

const browser = goog.require('goog.labs.userAgent.browser');
const log = goog.require('goog.log');


const LOGGER_ = log.getLogger('PersistPlugin');

const PERSISTENCE_SUCCEEDED = 'storage.persistence.succeeded';
const PERSISTENCE_ACCEPTED = 'storage.persistence.accepted';
const PERSISTENCE_DECLINED = 'storage.persistence.declined';
const PERSISTENCE_FAILED = 'storage.persistence.failed';


/**
 * Plugin to check for persistent storage and ask the user
 * to give permission for persistent storage.
 */
export default class PersistPlugin extends AbstractPlugin {
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
    const helpUrl = settings.getInstance().get('plugin.storage.persistenceHelp', 'https://web.dev/persistent-storage/');

    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persisted().then((result) => {
        if (!result) {
          const requestTime = Date.now();
          navigator.storage.persist().then((persistResult) => {
            if (!persistResult) {
              const now = Date.now();

              // this attempts to detect whether the user used a browser-provided prompt or if the request
              // was automatically handled in some fashion by the browser
              const userDecision = now - requestTime > 50;

              if (userDecision) {
                msgs.push(`By declining persistent storage, your application settings may be automatically
                  reset when under storage pressure (the conditions for that event vary by browser). Get more info
                  <a href="${helpUrl}" rel="noopener" target="_blank">here</a>`);
                this.log(msgs);
                metrics.updateMetric(PERSISTENCE_DECLINED, 1);
              } else if (browser.isChrome()) {
                msgs.push(`Chrome automatically manages the persistent storage permission based on the following
                  criteria (<a href="${helpUrl}"
                  rel="noopener" target="_blank">source</a>):
                  <ul><li>The site is bookmarked (and the user has 5 or less bookmarks)</li>
                  <li>The site has high site engagement [not quantified]</li>
                  <li>The site has been added to home screen</li>
                  <li>The site has push notifications enabled</li></ul> Try bookmarking the application or
                  allowing push notifications.`);

                if (window.Notification) {
                  if (Notification.permission === 'granted') {
                    log.warning(LOGGER_, 'Notifications are allowed but persistence is not!');
                    metrics.updateMetric(PERSISTENCE_DECLINED, 1);
                  } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission((permission) => {
                      if (permission === 'granted') {
                        metrics.updateMetric(PERSISTENCE_SUCCEEDED, 1);
                        metrics.updateMetric(PERSISTENCE_ACCEPTED, 1);
                      } else {
                        this.log(msgs);
                        metrics.updateMetric(PERSISTENCE_DECLINED, 1);
                      }
                    });
                  } else {
                    log.warning(LOGGER_, 'Notifications were previously denied');
                    metrics.updateMetric(PERSISTENCE_DECLINED, 1);
                  }
                }
              } else {
                msgs.push(`Browser automatically declined persistence. Get more info
                  <a href="${helpUrl}" rel="noopener" target="_blank">here</a>`);
                this.log(msgs);
                metrics.updateMetric(PERSISTENCE_DECLINED, 1);
              }
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
      let msg = '';
      if (window.isSecureContext === false) {
        msg = `This application is not being served in a secure context. The persistent storage permission
            will be automatically declined. `;
      }

      msg += `Your application settings may be automatically reset when under storage pressure. Get more info
        <a href="${helpUrl}" rel="noopener" target="_blank">here</a>`;
      msgs.push(msg);

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
    alertManager.getInstance().sendAlert(msg, AlertEventSeverity.WARNING);
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
