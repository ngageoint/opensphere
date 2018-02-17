goog.provide('os.source.IStyle');


/**
 * Interface for marking sources which support style changes
 * @interface
 */
os.source.IStyle = function() {};

/**
 * @const
 * @type {string}
 */
os.source.IStyle.ID = 'os.source.IStyle';

/**
 * @return {?(string|osx.ogc.TileStyle)}
 */
os.source.IStyle.prototype.getStyle;

/**
 * @param {?(string|osx.ogc.TileStyle)} value
 */
os.source.IStyle.prototype.setStyle;
