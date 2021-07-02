goog.declareModuleId('os.proj.reprojection');

/**
 * Whether or not raster reprojection is supported.
 * @type {boolean}
 */
let enableRasterReprojection = true;

/**
 * If raster reprojection is enabled.
 * @return {boolean}
 */
export const isRasterReprojectionEnabled = () => enableRasterReprojection;

/**
 * Set if raster reprojection is enabled.
 * @param {boolean} value The value.
 */
export const setEnableRasterReprojection = (value) => {
  enableRasterReprojection = value;
};
