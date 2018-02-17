goog.provide('os.layer.MockLayer');
goog.require('os.implements');
goog.require('goog.string');
goog.require('os.layer.ILayer');



/**
 * Mock layer for testing.
 * @implements {os.layer.ILayer}
 * @constructor
 */
os.layer.MockLayer = function() {
  this.id = this.title = goog.string.getRandomString();
  this.loading = false;
  this.explicitType = 'mock';
};
os.implements(os.layer.MockLayer, os.layer.ILayer.ID);


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.getId = function() {
  return this.id;
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.setId = function(value) {
  this.id = value;
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.isLoading = function() {
  return this.loading;
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.setLoading = function(value) {
  this.loading = value;
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.getTitle = function() {
  return this.title;
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.setTitle = function(value) {
  this.title = value;
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.getIcons = function() {
  return '';
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.getType = function() {
  return 'mock';
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.setType = function(value) {};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.getExplicitType = function() {
  return this.explicitType;
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.setExplicitType = function(value) {
  this.explicitType = value;
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.getProvider = function() {
  return 'mock';
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.setProvider = function(value) {};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.getBrightness = function() {
  return 1;
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.setBrightness = function(value) {};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.getContrast = function() {
  return 1;
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.setContrast = function(value) {};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.getHue = function() {
  return 0;
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.setHue = function(value) {};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.getOpacity = function() {
  return 1;
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.setOpacity = function(value) {};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.getSaturation = function() {
  return 1;
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.setSaturation = function(value) {};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.getLayerVisible = function() {
  return true;
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.setLayerVisible = function(value) {};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.getTags = function() {
  return [];
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.setTags = function(value) {};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.getLayerOptions = function() {
  return {};
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.setLayerOptions = function(value) {};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.getNodeUI = function() {
  return '';
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.setNodeUI = function(value) {};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.getGroupUI = function() {
  return '';
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.getLayerUI = function() {
  return '';
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.isRemovable = function() {
  return true;
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.setRemovable = function(value) {};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.getSynchronizerType = function() {
  return os.layer.SynchronizerType.VECTOR;
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.setSynchronizerType = function(value) {};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.getHidden = function() {
  return false;
};


/**
 * @inheritDoc
 */
os.layer.MockLayer.prototype.setHidden = function(value) {};


/**
 * Return the Z-index of the layer.
 * @return {number} The Z-index of the layer.
 */
os.layer.MockLayer.prototype.getZIndex = function() {
  return 0;
};
