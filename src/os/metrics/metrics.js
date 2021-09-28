goog.declareModuleId('os.metrics.Metrics');

import * as config from '../config/config.js';
import {getSettings} from '../config/configinstance.js';
import SettingChangeEvent from '../events/settingchangeevent.js';
import {set} from '../object/object.js';
import GraphiteMetricsProvider from './graphitemetricsprovider.js';
import {MAX_REGEXP, MIN_REGEXP, SUB_REGEX, MetricsEventType} from './index.js';

const {getDocument} = goog.require('goog.dom');
const {listen} = goog.require('goog.events');
const EventTarget = goog.require('goog.events.EventTarget');
const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');
const {getValueByKeys} = goog.require('goog.object');
const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');

const Logger = goog.requireType('goog.log.Logger');
const {default: IMetricServiceProvider} = goog.requireType('os.metrics.IMetricServiceProvider');


/**
 * Maintains all application metrics for a user.
 */
export default class Metrics extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The user's all-time metrics.
     * @type {!Object}
     * @private
     */
    this.allMetrics_ = {};

    /**
     * The application name sent to graphite/grafana
     * @type {string}
     * @private
     */
    this.appName_ = config.appNs;


    /**
     * If metrics is enabled in the application.
     * @type {boolean}
     * @private
     */
    this.enabled_ = /** @type {boolean} */ (getSettings().get('metrics.enabled', false));

    /**
     * Metric service provider
     * @type {IMetricServiceProvider}
     * @private
     */
    this.metricServiceProvider_ = null;

    if (this.enabled_) {
      // make sure metrics are sent/saved on unload
      window.addEventListener(GoogEventType.BEFOREUNLOAD, this.onBeforeUnload_.bind(this));

      this.metricServiceProvider_ = this.getMetricProvider_();

      var storedMetrics = getSettings().get(Metrics.STORAGE_KEY);
      this.allMetrics_ = /** @type {!Object} */ (storedMetrics || {});
      this.save();
      // setup global monitoring
      listen(getDocument().body, GoogEventType.CLICK, this.recordClickEvent);
    }
  }

  /**
   * If metrics are enabled in the application.
   *
   * @return {boolean}
   */
  isEnabled() {
    return this.enabled_;
  }

  /**
   * Returns the metric provider, if configured. Defaults to graphite.
   *
   * @private
   * @return {?IMetricServiceProvider}
   */
  getMetricProvider_() {
    if (this.metricServiceProvider_) {
      return this.metricServiceProvider_;
    } else {
      return new GraphiteMetricsProvider();
    }
  }

  /**
   * Returns the logging provider, if configured.
   *
   * @param {?IMetricServiceProvider} provider
   */
  setMetricProvider(provider) {
    this.metricServiceProvider_ = provider;
  }

  /**
   * Persists metrics before the application unloads.
   *
   * @private
   */
  onBeforeUnload_() {
    if (this.enabled_) {
      this.save();
    }
  }

  /**
   * Saves all metric values collected to settings if metrics
   * are enabled.
   *
   * NOTE: The method uses the settings service which is passed
   * an object reference to this.allMetrics_. The settings service
   * automatically saves the values it has a reference to, so its is not
   * necessary  to call save after changes to the same object. However,
   * if the object reference is reset, it will need to be
   * re-saved.
   *
   * @param {*=} opt_e The optional event parameter
   */
  save(opt_e) {
    if (this.enabled_) {
      getSettings().set(Metrics.STORAGE_KEY, this.allMetrics_);
      log.info(logger, 'Metrics locally saved');
    } else {
      var msg = 'Metrics were not saved: ' + (!this.enabled_ ? 'not enabled' : 'storage not available');
      log.warning(logger, msg);
    }
  }

  /**
   * Publishes user metrics immediately
   */
  publish() {
    if (this.enabled_) {
      this.save();

      const provider = this.getMetricProvider_();
      if (provider instanceof GraphiteMetricsProvider) {
        provider.publish();
      }
    } else {
      var msg = 'Metrics were not published: ' + (!this.enabled_ ? 'not enabled' : 'storage not available');
      log.warning(logger, msg);
    }
  }

  /**
   * Resets user metrics.
   */
  reset() {
    if (this.enabled_) {
      this.allMetrics_ = {};
      this.save();
      this.dispatchEvent(MetricsEventType.RESET);
      log.info(logger, 'Metrics reset');
    } else {
      var msg = 'Metrics were not reset: ' + (!this.enabled_ ? 'not enabled' : 'storage not available');
      log.warning(logger, msg);
    }
  }

  /**
   * Get the current value for a metric.
   *
   * @param {string} key A period-delimited metric key (ie, one.two.three)
   * @return {number} A deferred that resolves to the value
   */
  getMetric(key) {
    var value = 0;
    if (this.enabled_) {
      var keys = key.split('.');
      var keyValue = /** @type {number|undefined} */ (getValueByKeys(this.allMetrics_, keys));
      value = keyValue === undefined ? 0 : keyValue;
    } else {
      log.fine(logger, 'Metrics disabled - skipped get');
    }
    return value;
  }

  /**
   * Get the current value for a metric.
   *
   * @param {string} key A period-delimited metric key (ie, one.two.three)
   * @return {boolean} If the metric exists
   */
  hasMetric(key) {
    if (this.enabled_) {
      return this.hasMetric_(key, this.allMetrics_);
    }

    return false;
  }

  /**
   * Get the current value for a metric.
   *
   * @param {string} key A period-delimited metric key (ie, one.two.three)
   * @param {Object} obj The metrics object to test
   * @return {boolean} If the metric exists
   * @private
   */
  hasMetric_(key, obj) {
    var keys = key.split('.');
    var lastKey = keys.pop().replace(SUB_REGEX, '');

    for (var i = 0; i < keys.length; i++) {
      obj = obj[keys[i]];
      if (obj == null) {
        break;
      }
    }

    if (obj) {
      for (var objKey in obj) {
        if (obj.hasOwnProperty(objKey) && lastKey == objKey.replace(SUB_REGEX, '')) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Update a metric value.
   *
   * @param {?string} key A period-delimited metric key (ie, one.two.three)
   * @param {number} value
   */
  updateMetric(key, value) {
    try {
      if (this.enabled_ && !isEmptyOrWhitespace(makeSafe(key))) {
        // send to metric service, if defined.
        if (this.metricServiceProvider_) {
          // add on the app name so it's clear what app is being used
          var appKey = this.appName_ + '.' + key;
          this.metricServiceProvider_.recordMetric(appKey, value);
        }

        // TODO: Evaluate if this is needed
        var keys = key.split('.');
        var lastKey = keys[keys.length - 1];
        var temp = /** @type {number|undefined} */ (getValueByKeys(this.allMetrics_, keys));
        if (temp != null) {
          if (MAX_REGEXP.test(lastKey)) {
            // key is a max value, so take the largest one found
            value = Math.max(temp, value);
          } else if (MIN_REGEXP.test(lastKey)) {
            // key is a min value, so take the smallest one found
            value = Math.min(temp, value);
          } else {
            // key is a normal value, so add them
            value = temp + value;
          }
        }

        if (value != temp) {
          set(this.allMetrics_, keys, value);

          // strip off the delimiter since it isn't used to track feature usage
          var eventType = keys.join('.').replace(SUB_REGEX, '');
          this.dispatchEvent(new SettingChangeEvent(eventType, value));
        }
      } else {
        log.fine(logger, 'Metrics disabled or no key provided - skipped update');
      }
    } catch (err) {
      log.error(logger, 'updateMetric caused un-expected exception.', err);
    }
  }

  /**
   * Records click events for elements with a metric attribute.
   *
   * @param {Object} args event arguments
   */
  recordClickEvent(args) {
    try {
      var element = args.target;
      var attr = element.attributes.getNamedItem('metric');
      var metricKey = attr ? attr.value : null;
      if (isEmptyOrWhitespace(makeSafe(metricKey)) && element.parentElement) {
        attr = element.parentElement.attributes.getNamedItem('metric');
        metricKey = attr ? attr.value : null;
      }
      Metrics.getInstance().updateMetric(metricKey, 1);
    } catch (err) {
      log.error(logger, 'recordClickEvent caused un-expected exception.', err);
    }
  }

  /**
   * Get the global instance.
   * @return {!Metrics}
   */
  static getInstance() {
    if (!instance) {
      instance = new Metrics();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {Metrics} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {Metrics|undefined}
 */
let instance;

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.metrics.Metrics');

/**
 * Metrics storage key
 * @const
 */
Metrics.STORAGE_KEY = 'metrics.values';
