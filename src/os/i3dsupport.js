goog.provide('os.I3DSupport');



/**
 * @interface
 */
os.I3DSupport = goog.abstractMethod;


/**
 * Whether or not 3D is supported
 * @return {boolean}
 */
os.I3DSupport.prototype.is3DSupported = goog.abstractMethod;
