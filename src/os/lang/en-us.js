goog.module('os.lang');
goog.module.declareLegacyNamespace();

const Text = goog.require('os.Text');

/**
 * Single place to manage all the instances of the text for a given UI element / feature
 *
 * NOTE: Properties are sorted ALPHABETICALLY
 *
 * TODO: Investigate special treatment of these /lang/*.js files in the build process; then include one using
 * a setting and either a separate script load or a dynamic module import(`./lang/${myLanguage}.min.js`).
 * That way we seamlessly switch between languages/regionalizations with a single GET; all while on one instance
 * of the server.
 *
 * @enum {os.Text}
 */
const constants = {
  MENU_COLOR_RESET: new Text(
      undefined,
      'Reset Color',
      'Reset all item(s) to the default color from the Layer\'s Style'
  ),
  MENU_COLOR_SELECTED: new Text(
      undefined,
      'Color Selected',
      'Choose a color for the selected item(s)'
  )
};
// may want to leave "constants" unfrozen so external modules can extend or alter it; either directly or
// through a yet-to-be-defined interface
Object.freeze(constants);


exports = constants;
