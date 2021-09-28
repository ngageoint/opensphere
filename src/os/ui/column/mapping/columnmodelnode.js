goog.declareModuleId('os.ui.column.mapping.ColumnModelNode');

import SlickTreeNode from '../../slick/slicktreenode.js';

const {default: IColumnMapping} = goog.requireType('os.column.IColumnMapping');
const {default: IDataDescriptor} = goog.requireType('os.data.IDataDescriptor');
const {default: IOGCDescriptor} = goog.requireType('os.ui.ogc.IOGCDescriptor');


/**
 * Tree node representing a column model.
 * @unrestricted
 */
export default class ColumnModelNode extends SlickTreeNode {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {?osx.column.ColumnModel}
     * @private
     */
    this['model'] = null;

    /**
     * @type {?IColumnMapping}
     * @private
     */
    this['mapping'] = null;

    /**
     * @type {function(): !Array<!IDataDescriptor>}
     * @private
     */
    this['getFn'] = null;

    /**
     * @type {?IOGCDescriptor}
     * @private
     */
    this['initialLayer'] = null;

    this.setCheckboxVisible(false);
  }

  /**
   * Gets the column mapping associated with this node.
   *
   * @return {?osx.column.ColumnModel}
   */
  getColumnModel() {
    return this['model'];
  }

  /**
   * Sets the column mapping on this node. This also creates
   *
   * @param {?osx.column.ColumnModel} value
   */
  setColumnModel(value) {
    this['model'] = value;
  }

  /**
   * Get the mapping
   *
   * @return {?IColumnMapping}
   */
  getMapping() {
    return this['mapping'];
  }

  /**
   * Set the mapping
   *
   * @param {?IColumnMapping} value
   */
  setMapping(value) {
    this['mapping'] = value;
  }

  /**
   * Get the layer getter function
   *
   * @return {function(): !Array<!IDataDescriptor>}
   */
  getGetFn() {
    return this['getFn'];
  }

  /**
   * Set the layer getter function
   *
   * @param {function(): !Array<!IDataDescriptor>} value
   */
  setGetFn(value) {
    this['getFn'] = value;
  }

  /**
   * Get the initial layer
   *
   * @return {?IOGCDescriptor}
   */
  getInitialLayer() {
    return this['initialLayer'];
  }

  /**
   * Set the initial layer
   *
   * @param {?IOGCDescriptor} value
   */
  setInitialLayer(value) {
    this['initialLayer'] = value;
  }

  /**
   * @inheritDoc
   */
  updateFrom(other) {
    super.updateFrom(other);

    const node = /** @type {ColumnModelNode} */ (other);
    this.setColumnModel(node.getColumnModel());
    this.setMapping(node.getMapping());
    this.setGetFn(node.getGetFn());
    this.setInitialLayer(node.getInitialLayer());
  }
}
