goog.declareModuleId('os.style.IStyleReader');

// const Fill = goog.requireTyped('ol.style.Fill');
// const Icon = goog.requireTyped('ol.style.Icon');
// const Image = goog.requireTyped('ol.style.Image');
// const Stroke = goog.requireTyped('ol.style.Stroke');
// const Style = goog.requireTyped('ol.style.Style');
// const Text = goog.requireTyped('ol.style.Text');


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

export default IStyleReader;
