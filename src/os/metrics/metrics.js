goog.provide('os.metrics');
goog.provide('os.metrics.Metrics');

goog.require('goog.Timer');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.log');
goog.require('goog.object');
goog.require('os.color');
goog.require('os.config');
goog.require('os.events.SettingChangeEvent');
goog.require('os.metrics.GraphiteMetricsProvider');
goog.require('os.metrics.IMetricServiceProvider');
goog.require('os.metrics.keys');
goog.require('os.net');
goog.require('os.net.JsonEncFormatter');
goog.require('os.net.Request');
goog.require('os.object');
goog.require('os.storage');
goog.require('os.storage.AsyncStorageWrapper');
goog.require('os.storage.IDBStorage');


/**
 * Metrics events.
 * @enum {string}
 */
os.metrics.MetricsEventType = {
  RESET: 'metrics:reset'
};



/**
 * Maintains all application metrics for a user.
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.metrics.Metrics = function() {
  os.metrics.Metrics.base(this, 'constructor');

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
  this.appName_ = os.config.appNs;


  /**
   * If metrics is enabled in the application.
   * @type {boolean}
   * @private
   */
  this.enabled_ = /** @type {boolean} */ (os.settings.get('metrics.enabled', false));

  /**
  * Metric service provider
  * @type {os.metrics.IMetricServiceProvider}
  * @private
  */
  this.metricServiceProvider_ = null;

  /**
   * Timer for periodically saving the metrics
   * @type {goog.Timer}
   * @private
   */
  this.timer_ = null;

  if (this.enabled_) {
    // make sure metrics are sent/saved on unload
    window.addEventListener(goog.events.EventType.BEFOREUNLOAD, this.onBeforeUnload_.bind(this));

    this.metricServiceProvider_ = this.getMetricProvider_();

    var storedMetrics = os.settings.get(os.metrics.Metrics.STORAGE_KEY);
    this.allMetrics_ = /** @type {!Object} */ (storedMetrics || {});
    this.save();
    // setup global monitoring
    goog.events.listen(goog.dom.getDocument().body,
        goog.events.EventType.CLICK, this.recordClickEvent);
  }
};
goog.inherits(os.metrics.Metrics, goog.events.EventTarget);
goog.addSingletonGetter(os.metrics.Metrics);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.metrics.Metrics.LOGGER_ = goog.log.getLogger('os.metrics.Metrics');


/**
 * Metrics storage key
 * @const
 */
os.metrics.Metrics.STORAGE_KEY = 'metrics.values';


/**
 * @inheritDoc
 */
os.metrics.Metrics.prototype.disposeInternal = function() {
  goog.dispose(this.storage_);
  this.storage_ = null;

  goog.dispose(this.timer_);
  this.timer_ = null;
};


/**
 * If metrics are enabled in the application.
 * @return {boolean}
 */
os.metrics.Metrics.prototype.isEnabled = function() {
  return this.enabled_;
};


/**
 * Returns the metric provider, if configured. Defaults to graphite.
 * @private
 * @return {?os.metrics.IMetricServiceProvider}
 */
os.metrics.Metrics.prototype.getMetricProvider_ = function() {
  if (this.metricServiceProvider_) {
    return this.metricServiceProvider_;
  } else {
    return new os.metrics.GraphiteMetricsProvider();
  }
};


/**
 * Returns the logging provider, if configured.
 * @param {?os.metrics.IMetricServiceProvider} provider
 */
os.metrics.Metrics.prototype.setMetricProvider = function(provider) {
  this.metricServiceProvider_ = provider;
};


/**
 * Persists metrics before the application unloads.
 * @private
 */
os.metrics.Metrics.prototype.onBeforeUnload_ = function() {
  if (this.enabled_) {
    this.save();
  }
};


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
 * @param {*=} opt_e The optional event parameter
 */
os.metrics.Metrics.prototype.save = function(opt_e) {
  if (this.enabled_) {
    os.settings.set(os.metrics.Metrics.STORAGE_KEY, this.allMetrics_);
    goog.log.info(os.metrics.Metrics.LOGGER_, 'Metrics locally saved');
  } else {
    var msg = 'Metrics were not saved: ' + (!this.enabled_ ? 'not enabled' : 'storage not available');
    goog.log.warning(os.metrics.Metrics.LOGGER_, msg);
  }
};

/**
 * Publishes user metrics immediately
 */
os.metrics.Metrics.prototype.publish = function() {
  if (this.enabled_) {
    this.save();
    this.getMetricProvider_().publish();
  } else {
    var msg = 'Metrics were not published: ' + (!this.enabled_ ? 'not enabled' : 'storage not available');
    goog.log.warning(os.metrics.Metrics.LOGGER_, msg);
  }
};

/**
 * Resets user metrics.
 */
os.metrics.Metrics.prototype.reset = function() {
  if (this.enabled_) {
    this.allMetrics_ = {};
    this.save();
    this.dispatchEvent(os.metrics.MetricsEventType.RESET);
    goog.log.info(os.metrics.Metrics.LOGGER_, 'Metrics reset');
  } else {
    var msg = 'Metrics were not reset: ' + (!this.enabled_ ? 'not enabled' : 'storage not available');
    goog.log.warning(os.metrics.Metrics.LOGGER_, msg);
  }
};


/**
 * Get the current value for a metric.
 * @param {string} key A period-delimited metric key (ie, one.two.three)
 * @return {number} A deferred that resolves to the value
 */
os.metrics.Metrics.prototype.getMetric = function(key) {
  var value = 0;
  if (this.enabled_) {
    var keys = key.split('.');
    var keyValue = /** @type {number|undefined} */ (goog.object.getValueByKeys(this.allMetrics_, keys));
    value = keyValue === undefined ? 0 : keyValue;
  } else {
    goog.log.fine(os.metrics.Metrics.LOGGER_, 'Metrics disabled - skipped get');
  }
  return value;
};


/**
 * Get the current value for a metric.
 * @param {string} key A period-delimited metric key (ie, one.two.three)
 * @return {boolean} If the metric exists
 */
os.metrics.Metrics.prototype.hasMetric = function(key) {
  if (this.enabled_) {
    return this.hasMetric_(key, this.allMetrics_);
  }

  return false;
};


/**
 * Get the current value for a metric.
 * @param {string} key A period-delimited metric key (ie, one.two.three)
 * @param {Object} obj The metrics object to test
 * @return {boolean} If the metric exists
 * @private
 */
os.metrics.Metrics.prototype.hasMetric_ = function(key, obj) {
  var keys = key.split('.');
  var lastKey = keys.pop().replace(os.metrics.SUB_REGEX, '');

  for (var i = 0; i < keys.length; i++) {
    obj = obj[keys[i]];
    if (obj == null) {
      break;
    }
  }

  if (obj) {
    for (var objKey in obj) {
      if (obj.hasOwnProperty(objKey) && lastKey == objKey.replace(os.metrics.SUB_REGEX, '')) {
        return true;
      }
    }
  }

  return false;
};


/**
 * Update a metric value.
 * @param {?string} key A period-delimited metric key (ie, one.two.three)
 * @param {number} value
 */
os.metrics.Metrics.prototype.updateMetric = function(key, value) {
  try {
    if (this.enabled_ && !goog.string.isEmptyOrWhitespace(goog.string.makeSafe(key))) {
      // send to metric service, if defined.
      if (this.metricServiceProvider_) {
        // add on the app name so it's clear what app is being used
        var appKey = this.appName_ + '.' + key;
        this.metricServiceProvider_.recordMetric(appKey, value);
      }

      // TODO: Evaluate if this is needed
      var keys = key.split('.');
      var lastKey = keys[keys.length - 1];
      var temp = /** @type {number|undefined} */ (goog.object.getValueByKeys(this.allMetrics_, keys));
      if (temp != null) {
        if (os.metrics.MAX_REGEXP.test(lastKey)) {
          // key is a max value, so take the largest one found
          value = Math.max(temp, value);
        } else if (os.metrics.MIN_REGEXP.test(lastKey)) {
          // key is a min value, so take the smallest one found
          value = Math.min(temp, value);
        } else {
          // key is a normal value, so add them
          value = temp + value;
        }
      }

      if (value != temp) {
        os.object.set(this.allMetrics_, keys, value);

        // strip off the delimiter since it isn't used to track feature usage
        var eventType = keys.join('.').replace(os.metrics.SUB_REGEX, '');
        this.dispatchEvent(new os.events.SettingChangeEvent(eventType, value));
      }
    } else {
      goog.log.fine(os.metrics.Metrics.LOGGER_, 'Metrics disabled or no key provided - skipped update');
    }
  } catch (err) {
    goog.log.error(os.metrics.Metrics.LOGGER_, 'updateMetric caused un-expected exception.', err);
  }
};


/**
 * Records click events for elements with a metric attribute.
 * @param {Object} args event arguments
 */
os.metrics.Metrics.prototype.recordClickEvent = function(args) {
  try {
    var element = args.target;
    var attr = element.attributes.getNamedItem('metric');
    var metricKey = attr ? attr.value : null;
    if (goog.string.isEmptyOrWhitespace(goog.string.makeSafe(metricKey)) && element.parentElement) {
      attr = element.parentElement.attributes.getNamedItem('metric');
      metricKey = attr ? attr.value : null;
    }
    os.metrics.Metrics.getInstance().updateMetric(metricKey, 1);
  } catch (err) {
    goog.log.error(os.metrics.Metrics.LOGGER_, 'recordClickEvent caused un-expected exception.', err);
  }
};



/**
 * Gray-orange-yellow-green gradient for metrics completion.
 * @type {Array<os.color.GradientColor>}
 * @const
 */
os.metrics.METRIC_GRADIENT = [
  {
    alpha: 1.0,
    color: [187, 187, 187],
    ratio: 0
  },
  {
    alpha: 1.0,
    color: [220, 150, 75],
    ratio: 255 * 0.15
  },
  {
    alpha: 1.0,
    color: [255, 150, 0],
    ratio: 255 * 0.25
  },
  {
    alpha: 1.0,
    color: [255, 255, 0],
    ratio: 255 * 0.5
  },
  {
    alpha: 1.0,
    color: [0, 255, 0],
    ratio: 255
  }
];


/**
 * Delimiter used to sub-group a key.
 * @type {string}
 * @const
 */
os.metrics.SUB_DELIMITER = '#';


/**
 * Delimiter used to sub-group a key.
 * @type {RegExp}
 * @const
 */
os.metrics.SUB_REGEX = new RegExp(os.metrics.SUB_DELIMITER + '(.*)');


/**
 * Logger for os.metrics
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.metrics.LOGGER_ = goog.log.getLogger('os.metrics');


/**
 * @type {RegExp}
 * @const
 */
os.metrics.MAX_REGEXP = /^max-/;


/**
 * @type {RegExp}
 * @const
 */
os.metrics.MIN_REGEXP = /^min-/;


/**
 * Merges metrics objects, taking min/max values into account.
 * @param {Object} from The metrics object to merge
 * @param {Object} to The metrics object to merge into
 */
os.metrics.mergeMetrics = function(from, to) {
  for (var key in from) {
    if (key in to) {
      var fval = from[key];
      var tval = to[key];
      var ftype = typeof fval;
      var ttype = typeof tval;

      if (ftype === ttype) {
        switch (ftype) {
          case 'object':
            os.metrics.mergeMetrics(fval, tval);
            break;
          case 'number':
            if (os.metrics.MAX_REGEXP.test(key)) {
              to[key] = Math.max(to[key]);
            } else if (os.metrics.MIN_REGEXP.test(key)) {
              to[key] = Math.min(to[key]);
            } else {
              to[key] += from[key];
            }
            break;
          default:
            goog.log.error(os.metrics.LOGGER_, 'Unsupported type "' + ftype + '" for key "' + key + '"');
            break;
        }
      } else {
        goog.log.error(os.metrics.LOGGER_, 'Incompatible types on metric merge for key "' + key + '"');
      }
    } else {
      to[key] = from[key];
    }
  }
};
