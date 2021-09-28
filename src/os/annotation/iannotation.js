goog.declareModuleId('os.annotation.IAnnotation');

/**
 * Interface representing an annotation.
 *
 * @interface
 * @template T
 */
export default class IAnnotation {
  /**
   * Get the annotation options.
   * @return {osx.annotation.Options|undefined} The annotation options or undefined.
   */
  getOptions() {}

  /**
   * Set the annotation options.
   * @param {osx.annotation.Options|undefined} options The annotation options.
   */
  setOptions(options) {}

  /**
   * Creates the UI for the annotation.
   */
  createUI() {}

  /**
   * Dispose the annotation UI.
   */
  disposeUI() {}

  /**
   * Get if the annotation is visible.
   * @return {boolean} If the annotation is visible.
   */
  getVisible() {}

  /**
   * Set if the annotation is visible.
   * @param {boolean} value If the annotation is visible.
   */
  setVisible(value) {}
}
