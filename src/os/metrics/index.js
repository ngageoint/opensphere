goog.declareModuleId('os.metrics');

import {Layer as LayerKeys, Places as PlacesKeys, Servers as ServersKeys} from './metricskeys.js';

const log = goog.require('goog.log');

const Timer = goog.requireType('goog.Timer');
const {GradientColor} = goog.requireType('os.color');
const {default: IMetricServiceProvider} = goog.requireType('os.metrics.IMetricServiceProvider');


/**
 * Metrics events.
 * @enum {string}
 */
export const MetricsEventType = {
  RESET: 'metrics:reset'
};

/**
 * Layer metrics
 * @enum {string}
 * @deprecated Please use os.metrics.keys.Layer instead.
 */
export const Layer = LayerKeys;

/**
 * Places metrics
 * @enum {string}
 * @deprecated Please use os.metrics.keys.Places instead.
 */
export const Places = PlacesKeys;

/**
 * Servers metrics
 * @enum {string}
 * @deprecated Please use os.metrics.keys.Servers instead.
 */
export const Servers = ServersKeys;

/**
 * Gray-orange-yellow-green gradient for metrics completion.
 * @type {Array<GradientColor>}
 */
export const METRIC_GRADIENT = [
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
export const SUB_DELIMITER = '#';

/**
 * Delimiter used to sub-group a key.
 * @type {RegExp}
 */
export const SUB_REGEX = new RegExp(SUB_DELIMITER + '(.*)');

/**
 * Logger for os.metrics
 * @type {log.Logger}
 */
const logger = log.getLogger('os.metrics');

/**
 * @type {RegExp}
 */
export const MAX_REGEXP = /^max-/;

/**
 * @type {RegExp}
 */
export const MIN_REGEXP = /^min-/;

/**
 * Merges metrics objects, taking min/max values into account.
 *
 * @param {Object} from The metrics object to merge
 * @param {Object} to The metrics object to merge into
 */
export const mergeMetrics = function(from, to) {
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
