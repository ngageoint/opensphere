goog.provide('os.data.IExtent');



/**
 * @interface
 */
os.data.IExtent = function() {};


/**
 * @return {?ol.Extent} The extent or null
 */
os.data.IExtent.prototype.getExtent = goog.abstractMethod;
