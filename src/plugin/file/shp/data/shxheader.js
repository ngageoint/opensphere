goog.declareModuleId('plugin.file.shp.data.SHXHeader');

/**
 */
export default class SHXHeader {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {ArrayBuffer}
     */
    this.data = null;

    /**
     * @type {number}
     */
    this.position = 0;

    /**
     * Since we use an array buffer, we have to know how big it is before writing to it
     * @type {number}
     */
    this.allocation = 0;
  }
}
