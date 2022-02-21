goog.declareModuleId('plugin.file.shp.data.DBFField');

/**
 */
export default class DBFField {
  /**
   * Constructor.
   * @param {string} name
   * @param {string} type
   * @param {number} length
   */
  constructor(name, type, length) {
    /**
     * @type {string}
     */
    this.name = name;

    /**
     * @type {string}
     */
    this.type = type;

    /**
     * @type {number}
     */
    this.length = length;
  }
}
