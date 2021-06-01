goog.module('plugin.file.shp.data.SHXHeader');
goog.module.declareLegacyNamespace();


/**
 */
class SHXHeader {
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

exports = SHXHeader;
