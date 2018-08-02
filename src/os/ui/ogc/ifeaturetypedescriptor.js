goog.provide('os.ui.ogc.IFeatureTypeDescriptor');



/**
 * Interface for descriptors providing an `os.ogc.IFeatureType`.
 * @interface
 */
os.ui.ogc.IFeatureTypeDescriptor = function() {};


/**
 * @type {string}
 * @const
 */
os.ui.ogc.IFeatureTypeDescriptor.ID = 'os.ui.ogc.IFeatureTypeDescriptor';


/**
 * Get the FeatureType.
 * @return {os.ogc.IFeatureType}
 */
os.ui.ogc.IFeatureTypeDescriptor.prototype.getFeatureType;


/**
 * Check if the FeatureType is ready and load it if not.
 * @return {boolean}
 */
os.ui.ogc.IFeatureTypeDescriptor.prototype.isFeatureTypeReady;
