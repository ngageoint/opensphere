goog.module('os.ui.ILayerUIProvider');

/**
 * An interface for layer ui
 *
 * @interface
 */
class ILayerUIProvider {
  /**
   * Gets the layer controls UI
   * @param {*} item
   * @return {?string} The UI
   */
  getLayerUI(item) {}
}

/**
 * ID for interface {@see os.implements}
 * @const {string}
 */
ILayerUIProvider.ID = 'os.ui.ILayerUIProvider';

exports = ILayerUIProvider;
