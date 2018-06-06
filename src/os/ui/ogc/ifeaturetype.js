goog.provide('os.ui.ogc.IFeatureType');



/**
 * Interface for OGC feature type.
 * @interface
 */
os.ui.ogc.IFeatureType = function() {};


/**
 * @type {string}
 * @const
 */
os.ui.ogc.IFeatureType.ID = 'os.ui.ogc.IFeatureType';


/**
 * Get the WFS FeatureType.
 * @return {os.ogc.IFeatureType}
 */
os.ui.ogc.IFeatureType.prototype.getFeatureType;


/**
 * Check if the WFS FeatureType is ready and load it if not.
 * @return {boolean}
 */
os.ui.ogc.IFeatureType.prototype.isFeatureTypeReady;
