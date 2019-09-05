goog.provide('os.layer.config.AbstractLayerConfig');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.layer.config.ILayerConfig');
goog.require('os.net');
goog.require('os.style');



/**
 * @abstract
 * @implements {os.layer.config.ILayerConfig}
 * @constructor
 */
os.layer.config.AbstractLayerConfig = function() {
  /**
   * @type {number}
   * @protected
   */
  this.alpha = os.style.DEFAULT_ALPHA;

  /**
   * @type {Array<number>|string}
   * @protected
   */
  this.color = os.style.DEFAULT_LAYER_COLOR;

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
   * @type {goog.Uri.QueryData}
   * @protected
   */
  this.params = null;

  /**
   * @type {number}
   * @protected
   */
  this.size = os.style.DEFAULT_FEATURE_SIZE;

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
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.layer.config.AbstractLayerConfig.LOGGER_;
};


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.layer.config.AbstractLayerConfig.LOGGER_ = goog.log.getLogger('os.layer.config.LayerConfig');


/**
 * @abstract
 * @inheritDoc
 */
os.layer.config.AbstractLayerConfig.prototype.createLayer = function(options) {};


/**
 * @param {Object} options
 * @protected
 */
os.layer.config.AbstractLayerConfig.prototype.initializeConfig = function(options) {
  this.id = options['id'] || goog.string.getRandomString();
  this.columns = options['columns'] || null;

  if (options['title'] != null) {
    this.title = options['title'];
  }

  if (options['url'] != null) {
    this.url = options['url'];
  }

  if (options['params'] != null) {
    this.params = os.net.paramsToQueryData(options['params']);
  }

  this.alpha = goog.math.clamp(options['alpha'] || options['opacity'] || 1, 0, 1);

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
};
