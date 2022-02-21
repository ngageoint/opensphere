goog.declareModuleId('plugin.arc.ArcFeatureType');


/**
 * Feature type representing Arc features.
 *
 * @implements {IFeatureType}
 */
class ArcFeatureType {
  /**
   * Constructor.
   * @param {string=} opt_typeName
   * @param {Array<!FeatureTypeColumn>=} opt_columns
   */
  constructor(opt_typeName, opt_columns) {
    /**
     * @type {Array<!FeatureTypeColumn>}
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
  }

  /**
   * @inheritDoc
   */
  getTypeName() {
    return this.typeName_;
  }

  /**
   * @inheritDoc
   */
  setTypeName(value) {
    this.typeName_ = value;
  }

  /**
   * @inheritDoc
   */
  getTimeColumns() {
    return [];
  }

  /**
   * @inheritDoc
   */
  getGeometryColumnName() {
    return this.geometryColumnName_;
  }

  /**
   * @inheritDoc
   */
  setGeometryColumnName(value) {
    this.geometryColumnName_ = value;
  }

  /**
   * @inheritDoc
   */
  getStartDateColumnName() {
    return this.startDateColumnName_;
  }

  /**
   * @inheritDoc
   */
  setStartDateColumnName(value) {
    this.startDateColumnName_ = value;
  }

  /**
   * @inheritDoc
   */
  getEndDateColumnName() {
    return this.endDateColumnName_;
  }

  /**
   * @inheritDoc
   */
  setEndDateColumnName(value) {
    this.endDateColumnName_ = value;
  }

  /**
   * @inheritDoc
   */
  getColumns() {
    return this.columns_;
  }

  /**
   * @inheritDoc
   */
  setColumns(value) {
    this.columns_ = value;
  }

  /**
   * @inheritDoc
   */
  getNeedsTimeColumns() {
    return false;
  }

  /**
   * Persist the feature type.
   * @param {Object=} opt_to The persist object.
   * @return {!Object} The persist object.
   * @override
   */
  persist(opt_to) {
    return opt_to || {};
  }

  /**
   * @inheritDoc
   */
  restore(config) {}
}

export default ArcFeatureType;
