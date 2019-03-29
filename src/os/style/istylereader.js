goog.provide('os.style.IStyleReader');



/**
 * @interface
 * @template T
 */
os.style.IStyleReader = function() {};


/**
 * Get a style from the cache, or create a new one and add it to the cache.
 * @param {Object<string, *>} config
 * @return {T}
 */
os.style.IStyleReader.prototype.getOrCreateStyle;


/**
 * Sets the reader map
 * @param {!Object<string, os.style.IStyleReader>} readers
 */
os.style.IStyleReader.prototype.setReaders;


/**
 * Creates a reader config from a style
 * @param {!(ol.style.Style|ol.style.Fill|ol.style.Icon|ol.style.Image|ol.style.Stroke|ol.style.Text)} style
 * @param {Object<string, *>} obj
 */
os.style.IStyleReader.prototype.toConfig;
