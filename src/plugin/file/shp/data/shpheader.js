goog.declareModuleId('plugin.file.shp.data.SHPHeader');

import DBFHeader from './dbfheader.js';
import SHXHeader from './shxheader.js';

/**
 */
export default class SHPHeader {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {ArrayBuffer}
     */
    this.data = null;

    /**
     * @type {DBFHeader}
     */
    this.dbf = new DBFHeader();

    /**
     * @type {SHXHeader}
     */
    this.shx = new SHXHeader();

    /**
     * @type {number}
     */
    this.curRecord = 0;

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
