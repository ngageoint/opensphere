goog.provide('os.source.IStyle');



/**
 * Interface for marking sources which support style changes
 * @interface
 */
os.source.IStyle = function() {};


/**
 * @return {?(string|osx.ogc.TileStyle)}
 */
os.source.IStyle.prototype.getStyle = goog.abstractMethod;


/**
 * @param {?(string|osx.ogc.TileStyle)} value
 */
os.source.IStyle.prototype.setStyle;
