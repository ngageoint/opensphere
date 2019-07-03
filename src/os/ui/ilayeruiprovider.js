goog.provide('os.ui.ILayerUIProvider');

goog.require('os.implements');


/**
 * An interface for layer ui
 *
 * @interface
 */
os.ui.ILayerUIProvider = function() {};


/**
 * ID for interface {@see os.implements}
 * @const {string}
 */
os.ui.ILayerUIProvider.ID = 'os.ui.ILayerUIProvider';


/**
 * Gets the layer controls UI
 * @param {*} item
 * @return {?string} The UI
 */
os.ui.ILayerUIProvider.prototype.getLayerUI;
