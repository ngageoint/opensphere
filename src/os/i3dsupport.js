goog.module('os.I3DSupport');

/**
 * @interface
 */
class I3DSupport {
  /**
   * Whether or not 3D is supported
   * @return {boolean}
   */
  is3DSupported() {}
}

/**
 * @const
 * @type {string}
 */
I3DSupport.ID = 'os.I3DSupport';

exports = I3DSupport;
