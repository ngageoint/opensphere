goog.module('os.style.IStyleReader');
goog.module.declareLegacyNamespace();

const Fill = goog.requireType('ol.style.Fill');
const Icon = goog.requireType('ol.style.Icon');
const Image = goog.requireType('ol.style.Image');
const Stroke = goog.requireType('ol.style.Stroke');
const Style = goog.requireType('ol.style.Style');
const Text = goog.requireType('ol.style.Text');


/**
 * @interface
 * @template T
 */
class IStyleReader {
  /**
   * Get a style from the cache, or create a new one and add it to the cache.
   * @param {!Object<string, *>} config
   * @return {T}
   */
  getOrCreateStyle(config) {}

  /**
   * Sets the reader map
   * @param {!Object<string, IStyleReader>} readers
   */
  setReaders(readers) {}

  /**
   * Creates a reader config from a style
   * @param {!(Style|Fill|Icon|Image|Stroke|Text)} style
   * @param {Object<string, *>} obj
   */
  toConfig(style, obj) {}
}

exports = IStyleReader;
