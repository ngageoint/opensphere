goog.module('os.metrics');
goog.module.declareLegacyNamespace();

const log = goog.require('goog.log');
const {
  Layer: LayerKeys,
  Places: PlacesKeys,
  Servers: ServersKeys
} = goog.require('os.metrics.keys');

const Timer = goog.requireType('goog.Timer');
const {GradientColor} = goog.requireType('os.color');
const IMetricServiceProvider = goog.requireType('os.metrics.IMetricServiceProvider');


/**
 * Metrics events.
 * @enum {string}
 */
const MetricsEventType = {
  RESET: 'metrics:reset'
};

/**
 * Layer metrics
 * @enum {string}
 * @deprecated Please use os.metrics.keys.Layer instead.
 */
const Layer = LayerKeys;

/**
 * Places metrics
 * @enum {string}
 * @deprecated Please use os.metrics.keys.Places instead.
 */
const Places = PlacesKeys;

/**
 * Servers metrics
 * @enum {string}
 * @deprecated Please use os.metrics.keys.Servers instead.
 */
const Servers = ServersKeys;

/**
 * Gray-orange-yellow-green gradient for metrics completion.
 * @type {Array<GradientColor>}
 */
const METRIC_GRADIENT = [
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
 */
const SUB_DELIMITER = '#';

/**
 * Delimiter used to sub-group a key.
 * @type {RegExp}
 */
const SUB_REGEX = new RegExp(SUB_DELIMITER + '(.*)');

/**
 * Logger for os.metrics
 * @type {log.Logger}
 */
const logger = log.getLogger('os.metrics');

/**
 * @type {RegExp}
 */
const MAX_REGEXP = /^max-/;

/**
 * @type {RegExp}
 */
const MIN_REGEXP = /^min-/;

/**
 * Merges metrics objects, taking min/max values into account.
 *
 * @param {Object} from The metrics object to merge
 * @param {Object} to The metrics object to merge into
 */
const mergeMetrics = function(from, to) {
  for (var key in from) {
    if (key in to) {
      var fval = from[key];
      var tval = to[key];
      var ftype = typeof fval;
      var ttype = typeof tval;

      if (ftype === ttype) {
        switch (ftype) {
          case 'object':
            mergeMetrics(fval, tval);
            break;
          case 'number':
            if (MAX_REGEXP.test(key)) {
              to[key] = Math.max(to[key]);
            } else if (MIN_REGEXP.test(key)) {
              to[key] = Math.min(to[key]);
            } else {
              to[key] += from[key];
            }
            break;
          default:
            log.error(logger, 'Unsupported type "' + ftype + '" for key "' + key + '"');
            break;
        }
      } else {
        log.error(logger, 'Incompatible types on metric merge for key "' + key + '"');
      }
    } else {
      to[key] = from[key];
    }
  }
};

exports = {
  MetricsEventType,
  Layer,
  Places,
  Servers,
  METRIC_GRADIENT,
  SUB_DELIMITER,
  SUB_REGEX,
  MAX_REGEXP,
  MIN_REGEXP,
  mergeMetrics
};
