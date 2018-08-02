goog.provide('os.data.IExtent');



/**
 * @interface
 */
os.data.IExtent = function() {};

/**
 * @const
 * @type {string}
 */
os.data.IExtent.ID = 'os.data.IExtent';


/**
 * @return {?ol.Extent} The extent or null
 */
os.data.IExtent.prototype.getExtent = goog.abstractMethod;
