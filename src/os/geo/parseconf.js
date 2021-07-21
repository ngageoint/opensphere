goog.module('os.geo.ParseConf');
goog.module.declareLegacyNamespace();

/**
 * The parse config for os.geo.
 */
class ParseConf {
  /**
   * Constructor.
   * @param {RegExp} regex The regular expression for parsing.
   * @param {Array<{deg: number, min: number, sec: number, dir: number}>} coords The coords array.
   */
  constructor(regex, coords) {
    /**
     * The regular expression for parsing.
     * @type {RegExp}
     */
    this.regex = regex;

    /**
     * The array of group positions.
     * @type {Array<{deg: !number, min: number, sec: number, dir: number}>}
     */
    this.coords = coords;
  }
}

exports = ParseConf;
