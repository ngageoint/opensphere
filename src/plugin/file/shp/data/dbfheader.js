goog.declareModuleId('plugin.file.shp.data.DBFHeader');

const {default: DBFField} = goog.requireType('plugin.file.shp.data.DBFField');


/**
 */
export default class DBFHeader {
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
    this.numRecords = 0;

    /**
     * @type {number}
     */
    this.recordSize = 0;

    /**
     * @type {number}
     */
    this.recordStart = 0;

    /**
     * @type {Array.<DBFField>}
     */
    this.fields = [];

    /**
     * Since we use an array buffer, we have to know how big it is before writing to it
     * @type {number}
     */
    this.allocation = 0;

    /**
     * @type {number}
     */
    this.position = 0;
  }
}
