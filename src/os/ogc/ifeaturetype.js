goog.declareModuleId('os.ogc.IFeatureType');

const {default: IPersistable} = goog.requireType('os.IPersistable');
const {default: FeatureTypeColumn} = goog.requireType('os.ogc.FeatureTypeColumn');


/**
 * @interface
 * @extends {IPersistable}
 */
export default class IFeatureType {
  /**
   * @return {?string}
   */
  getTypeName() {}

  /**
   * @param {?string} value
   */
  setTypeName(value) {}

  /**
   * @return {Array}
   */
  getTimeColumns() {}

  /**
   * @return {?string}
   */
  getGeometryColumnName() {}

  /**
   * @param {?string} value
   */
  setGeometryColumnName(value) {}

  /**
   * @return {?string}
   */
  getStartDateColumnName() {}

  /**
   * @param {?string} value
   */
  setStartDateColumnName(value) {}

  /**
   * @return {?string}
   */
  getEndDateColumnName() {}

  /**
   * @param {?string} value
   */
  setEndDateColumnName(value) {}

  /**
   * @return {Array<!FeatureTypeColumn>}
   */
  getColumns() {}

  /**
   * @param {Array<!FeatureTypeColumn>} value
   */
  setColumns(value) {}

  /**
   * @return {boolean}
   */
  getNeedsTimeColumns() {}
}
