goog.provide('plugin.arc.ArcFeatureType');
goog.require('os.ogc.IFeatureType');



/**
 * Feature type representing Arc features.
 * @param {string=} opt_typeName
 * @param {Array<!os.ogc.FeatureTypeColumn>=} opt_columns
 * @implements {os.ogc.IFeatureType}
 * @constructor
 */
plugin.arc.ArcFeatureType = function(opt_typeName, opt_columns) {
  /**
   * @type {Array<!os.ogc.FeatureTypeColumn>}
   * @private
   */
  this.columns_ = opt_columns || null;

  /**
   * @type {?string}
   * @private
   */
  this.geometryColumnName_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.startDateColumnName_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.endDateColumnName_ = null;


  /**
   * @type {?string}
   * @private
   */
  this.typeName_ = opt_typeName || null;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcFeatureType.prototype.getTypeName = function() {
  return this.typeName_;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcFeatureType.prototype.setTypeName = function(value) {
  this.typeName_ = value;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcFeatureType.prototype.getTimeColumns = function() {
  return [];
};


/**
 * @inheritDoc
 */
plugin.arc.ArcFeatureType.prototype.getGeometryColumnName = function() {
  return this.geometryColumnName_;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcFeatureType.prototype.setGeometryColumnName = function(value) {
  this.geometryColumnName_ = value;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcFeatureType.prototype.getStartDateColumnName = function() {
  return this.startDateColumnName_;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcFeatureType.prototype.setStartDateColumnName = function(value) {
  this.startDateColumnName_ = value;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcFeatureType.prototype.getEndDateColumnName = function() {
  return this.endDateColumnName_;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcFeatureType.prototype.setEndDateColumnName = function(value) {
  this.endDateColumnName_ = value;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcFeatureType.prototype.getColumns = function() {
  return this.columns_;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcFeatureType.prototype.setColumns = function(value) {
  this.columns_ = value;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcFeatureType.prototype.getNeedsTimeColumns = function() {
  return false;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcFeatureType.prototype.persist = function(opt_to) {
};


/**
 * @inheritDoc
 */
plugin.arc.ArcFeatureType.prototype.restore = function(config) {
};
