goog.module('os.source.IStyle');
goog.module.declareLegacyNamespace();


/**
 * Interface for marking sources which support style changes
 *
 * @interface
 */
class IStyle {
  /**
   * @return {?(string|osx.ogc.TileStyle)}
   */
  getStyle() {}

  /**
   * @param {?(string|osx.ogc.TileStyle)} value
   */
  setStyle(value) {}
}

/**
 * @const
 * @type {string}
 */
IStyle.ID = 'os.source.IStyle';

exports = IStyle;
