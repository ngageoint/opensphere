goog.module('os.style.defaults');

const {DEFAULT_ICON_PATH, replaceGoogleUri} = goog.require('os.ui.file.kml');


/**
 * The default icon (white circle).
 * @type {string}
 */
const DEFAULT_ICON = replaceGoogleUri(DEFAULT_ICON_PATH);

/**
 * Default icon options.
 * @type {!olx.style.IconOptions}
 */
const DEFAULT_ICON_OPTIONS = {
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

exports = {
  DEFAULT_ICON,
  DEFAULT_ICON_OPTIONS
};
