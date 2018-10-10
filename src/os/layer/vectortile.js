goog.provide('os.layer.VectorTile');

goog.require('ol.layer.VectorTile');
goog.require('ol.renderer.canvas.VectorTileLayer');
goog.require('os.layer.ILayer');
goog.require('os.layer.Tile');
goog.require('os.mixin.VectorImageTile');

/**
 * @fileoverview
 * @suppress {unusedPrivateMembers}
 */

/**
 * @extends {ol.layer.VectorTile}
 * @implements {os.layer.ILayer}
 * @param {olx.layer.VectorTileOptions} options Tile layer options
 * @constructor
 * @suppress {accessControls}
 */
os.layer.VectorTile = function(options) {
  os.layer.VectorTile.base(this, 'constructor', options);

  /**
   * @type {!string}
   * @private
   */
  this.id_ = goog.string.getRandomString();

  /**
   * @type {?string}
   * @private
   */
  this.osType_ = os.layer.LayerType.TILES;

  /**
   * @type {string}
   * @private
   */
  this.explicitType_ = os.layer.ExplicitLayerType.TILES;

  /**
   * @type {!string}
   * @private
   */
  this.title_ = 'New Layer';

  /**
   * @type {boolean}
   * @private
   */
  this.error_ = false;

  /**
   * @type {boolean}
   * @private
   */
  this.loading_ = false;

  /**
   * @type {?string}
   * @private
   */
  this.provider_ = null;

  /**
   * @type {?Array<!string>}
   * @private
   */
  this.tags_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.removable_ = true;

  /**
   * @type {Object<string, *>}
   * @private
   */
  this.layerOptions_ = null;

  /**
   * @type {!string}
   * @private
   */
  this.nodeUI_ = '<defaultlayernodeui></defaultlayernodeui>';

  /**
   * @type {!string}
   * @private
   */
  this.layerUi_ = 'tilelayerui';

  /**
   * @type {?string}
   * @private
   */
  this.syncType_ = os.layer.SynchronizerType.TILE;

  /**
   * @type {boolean}
   * @private
   */
  this.hidden_ = false;

  /**
   * @type {os.tile.TileFilterFn}
   * @private
   */
  this.colorFilter_ = os.layer.Tile.applyColors.bind(this);

  var source = this.getSource();
  if (source) {
    ol.events.listen(source, goog.events.EventType.PROPERTYCHANGE, this.onSourcePropertyChange_, this);
  }

  /**
   * @type {!ol.renderer.canvas.VectorTileLayer}
   * @private
   */
  this.renderer_ = new ol.renderer.canvas.VectorTileLayer(this);
};
goog.inherits(os.layer.VectorTile, ol.layer.VectorTile);
os.implements(os.layer.VectorTile, os.layer.ILayer.ID);


/**
 * @return {!ol.renderer.canvas.VectorTileLayer}
 */
os.layer.VectorTile.prototype.getRenderer = function() {
  return this.renderer_;
};


/**
 * @inheritDoc
 * @suppress {visibility}
 */
os.layer.VectorTile.prototype.disposeInternal = os.layer.Tile.prototype.disposeInternal;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setMinResolution = os.layer.Tile.prototype.setMinResolution;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setMaxResolution = os.layer.Tile.prototype.setMaxResolution;

/**
 * @private
 * @suppress {visibility}
 */
os.layer.VectorTile.updateIcons_ = os.layer.Tile.prototype.updateIcons_;

/**
 * @private
 * @suppress {visibility}
 */
os.layer.VectorTile.prototype.onSourcePropertyChange_ = os.layer.Tile.prototype.onSourcePropertyChange_;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.getId = os.layer.Tile.prototype.getId;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setId = os.layer.Tile.prototype.setId;

os.layer.VectorTile.prototype.getDefaultColor = os.layer.Tile.prototype.getDefaultColor;

os.layer.VectorTile.prototype.getColor = os.layer.Tile.prototype.getColor;
os.layer.VectorTile.prototype.setColor = os.layer.Tile.prototype.setColor;

os.layer.VectorTile.prototype.getColorize = os.layer.Tile.prototype.getColorize;
os.layer.VectorTile.prototype.setColorize = os.layer.Tile.prototype.setColorize;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.getBrightness = os.layer.Tile.prototype.getBrightness;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setBrightness = os.layer.Tile.prototype.setBrightness;


/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setBrightness = os.layer.Tile.prototype.setBrightness;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.getContrast = os.layer.Tile.prototype.getContrast;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setContrast = os.layer.Tile.prototype.setContrast;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.getSaturation = os.layer.Tile.prototype.getSaturation;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setSaturation = os.layer.Tile.prototype.setSaturation;

/**
 * @suppress {visibility}
 */
os.layer.VectorTile.prototype.updateColorFilter = os.layer.Tile.prototype.updateColorFilter;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.getIcons = os.layer.Tile.prototype.getIcons;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.isLoading = os.layer.Tile.prototype.isLoading;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setLoading = os.layer.Tile.prototype.setLoading;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.getTitle = os.layer.Tile.prototype.getTitle;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setTitle = os.layer.Tile.prototype.setTitle;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.getOSType = os.layer.Tile.prototype.getOSType;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setOSType = os.layer.Tile.prototype.setOSType;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.getExplicitType = os.layer.Tile.prototype.getExplicitType;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setExplicitType = os.layer.Tile.prototype.setExplicitType;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.getProvider = os.layer.Tile.prototype.getProvider;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setProvider = os.layer.Tile.prototype.setProvider;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.getTags = os.layer.Tile.prototype.getTags;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setTags = os.layer.Tile.prototype.setTags;

os.layer.VectorTile.prototype.getError = os.layer.Tile.prototype.getError;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.isRemovable = os.layer.Tile.prototype.isRemovable;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setRemovable = os.layer.Tile.prototype.setRemovable;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.getNodeUI = os.layer.Tile.prototype.getNodeUI;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setNodeUI = os.layer.Tile.prototype.setNodeUI;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.getLayerUI = os.layer.Tile.prototype.getLayerUI;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setLayerUI = os.layer.Tile.prototype.setLayerUI;

/**
 * @suppress {visibility}
 */
os.layer.VectorTile.prototype.identify = os.layer.Tile.prototype.identify;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.getLayerVisible = os.layer.Tile.prototype.getLayerVisible;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setLayerVisible = os.layer.Tile.prototype.setLayerVisible;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.getBaseVisible = os.layer.Tile.prototype.getBaseVisible;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setBaseVisible = os.layer.Tile.prototype.setBaseVisible;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.getLayerOptions = os.layer.Tile.prototype.getLayerOptions;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setLayerOptions = os.layer.Tile.prototype.setLayerOptions;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.callAction = os.layer.Tile.prototype.callAction;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.getGroupUI = os.layer.Tile.prototype.getGroupUI;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.supportsAction = os.layer.Tile.prototype.supportsAction;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.getSynchronizerType = os.layer.Tile.prototype.getSynchronizerType;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setSynchronizerType = os.layer.Tile.prototype.setSynchronizerType;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.getHidden = os.layer.Tile.prototype.getHidden;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.setHidden = os.layer.Tile.prototype.setHidden;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.persist = os.layer.Tile.prototype.persist;

/**
 * @inheritDoc
 */
os.layer.VectorTile.prototype.restore = os.layer.Tile.prototype.restore;
