goog.declareModuleId('os.layer.config.AbstractLayerConfig');

import {paramsToQueryData} from '../../net/net.js';
import {DEFAULT_ALPHA, DEFAULT_FEATURE_SIZE, DEFAULT_LAYER_COLOR} from '../../style/style.js';

const {getLogger} = goog.require('goog.log');
const {clamp} = goog.require('goog.math');
const {getRandomString} = goog.require('goog.string');

const QueryData = goog.requireType('goog.Uri.QueryData');
const Logger = goog.requireType('goog.log.Logger');
const {default: ILayerConfig} = goog.requireType('os.layer.config.ILayerConfig');


/**
 * @abstract
 * @implements {ILayerConfig}
 */
export default class AbstractLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {number}
     * @protected
     */
    this.alpha = DEFAULT_ALPHA;

    /**
     * @type {Array<number>|string}
     * @protected
     */
    this.color = DEFAULT_LAYER_COLOR;

    /**
     * @type {Array<number>|string}
     * @protected
     */
    this.fillColor = 'rgba(255,255,255,0)';

    /**
     * @type {Array<string>}
     * @protected
     */
    this.columns = null;

    /**
     * @type {boolean}
     * @protected
     */
    this.colorize = false;

    /**
     * @type {string}
     * @protected
     */
    this.id = '';

    /**
     * @type {QueryData}
     * @protected
     */
    this.params = null;

    /**
     * @type {number}
     * @protected
     */
    this.size = DEFAULT_FEATURE_SIZE;

    /**
     * @type {string}
     * @protected
     */
    this.title = 'New Layer';

    /**
     * @type {string}
     * @protected
     */
    this.url = '';

    /**
     * @type {boolean}
     * @protected
     */
    this.visible = true;

    /**
     * @type {Logger}
     * @protected
     */
    this.log = logger;
  }

  /**
   * @param {Object} options
   * @protected
   */
  initializeConfig(options) {
    this.id = options['id'] || getRandomString();
    this.columns = options['columns'] || null;

    if (options['title'] != null) {
      this.title = options['title'];
    }

    if (options['url'] != null) {
      this.url = options['url'];
    }

    if (options['params'] != null) {
      this.params = paramsToQueryData(options['params']);
    }

    this.alpha = clamp(options['alpha'] || options['opacity'] || 1, 0, 1);

    if (options['size'] != null) {
      this.size = options['size'];
    }

    if (options['color'] != null) {
      this.color = options['color'];
    }

    if (typeof this.color === 'string') {
      this.color = /** @type {string} */ (this.color).replace(/^0x/, '#');
    }

    if (options['colorize'] != null) {
      this.colorize = options['colorize'];
    }

    if (options['visible'] != null) {
      this.visible = options['visible'];
    }
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = getLogger('os.layer.config.LayerConfig');
