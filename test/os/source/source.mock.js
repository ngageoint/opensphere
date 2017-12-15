goog.provide('os.source.MockSource');

goog.require('os.source.ISource');



/**
 * Mock source.
 * @implements {os.source.ISource}
 * @constructor
 */
os.source.MockSource = function() {
  this.columns = [];
  this.id = 'testSource';
  this.features = [];
  this.loading = false;
  this.lockable = false;
  this.refreshInterval = 0;
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.addFeature = function(feature) {
  this.features.push(feature);
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.removeFeature = function(feature) {
  var idx = this.features.indexOf(feature);
  if (idx > -1) {
    this.features.splice(idx, 1);
  }
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.addFeatures = function(features) {
  this.features = this.features.concat(features);
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.clear = function() {
  this.features.length = 0;
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.refresh = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.isRefreshEnabled = function() {
  return true;
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.getRefreshInterval = function() {
  return this.refreshInterval;
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.setRefreshInterval = function(value) {
  this.refreshInterval = value;
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.onRefreshDelay = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.getColor = function() {
  return 'rgba(255,255,255,1)';
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.getColumns = function() {
  return this.columns;
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.setColumns = function(value) {
  this.columns = value;
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.getId = function() {
  return this.id;
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.setId = function(value) {
  this.id = value;
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.isLoading = function() {
  return this.loading;
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.setLoading = function(value) {
  this.loading = value;
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.isLockable = function() {
  return this.lockable;
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.setLockable = function(value) {
  this.lockable = value;
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.isLocked = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.setLocked = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.getTitle = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.setTitle = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.getTimeEnabled = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.getTimeModel = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.setTimeEnabled = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.getVisible = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.setVisible = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.forEachFeature = function(callback, opt_this) {
  this.features.forEach(callback, opt_this);
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.getFeatures = function() {
  return this.features;
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.getHighlightedItems = function() {
  return [];
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.setHighlightedItems = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.displayAll = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.hideAll = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.hideFeatures = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.showFeatures = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.hideSelected = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.hideUnselected = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.getHiddenItems = function() {
  return [];
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.isHidden = function() {
  return false;
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.getUnselectedItems = function() {
  return [];
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.isSelected = function() {
  return false;
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.getSelectedItems = function() {
  return [];
};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.setSelectedItems = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.addToSelected = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.removeFromSelected = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.selectAll = function() {};


/**
 * @inheritDoc
 */
os.source.MockSource.prototype.selectNone = function() {};
