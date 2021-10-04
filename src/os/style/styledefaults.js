goog.declareModuleId('os.style.defaults');

import {DEFAULT_ICON_PATH, replaceGoogleUri} from '../ui/file/kml/kml.js';


/**
 * The default icon (white circle).
 * @type {string}
 */
export const DEFAULT_ICON = replaceGoogleUri(DEFAULT_ICON_PATH);

/**
 * Default icon options.
 * @type {!olx.style.IconOptions}
 */
export const DEFAULT_ICON_OPTIONS = {
  src: DEFAULT_ICON,
  // clear these out so the default icon displays correctly
  anchorOrigin: undefined,
  anchorXUnits: undefined,
  anchorYUnits: undefined,
  crossOrigin: undefined,
  offset: undefined,
  offsetOrigin: undefined,
  rotation: undefined,
  size: undefined,
  imgSize: undefined
};
