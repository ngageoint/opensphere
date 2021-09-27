goog.declareModuleId('os.ui.config.AngularAppSettingsInitializer');

const AbstractSettingsInitializer = goog.require('os.config.AbstractSettingsInitializer');
const ThemeSettings = goog.require('os.config.ThemeSettings');
const {getSettings} = goog.require('os.config.instance');
const {Keys} = goog.require('os.config.theme');
const BaseServerModifier = goog.require('os.net.BaseServerModifier');
const URLModifier = goog.require('os.net.URLModifier');


/**
 * @abstract
 */
export default class AngularAppSettingsInitializer extends AbstractSettingsInitializer {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The selector used to grab the element to bootstrap angular
     * @type {?string}
     * @protected
     */
    this.ngAppSelector = null;

    /**
     * The angular module to init
     * @type {?string}
     * @protected
     */
    this.ngAppModule = null;
  }

  /**
   * Check if the browser has required features to run the application.
   *
   * @return {boolean}
   * @protected
   */
  isBrowserSupported() {
    return Boolean(Modernizr && Modernizr.canvas && Modernizr.localstorage && Modernizr.sessionstorage &&
        Modernizr.boxshadow && Modernizr.svg && Modernizr.rgba && Modernizr.webworkers);
  }

  /**
   * @inheritDoc
   */
  onSettingsLoaded() {
    const settings = getSettings();

    // set up URL replacements
    URLModifier.configure(/** @type {Object<string, string>} */ (settings.get('urlReplace')));

    // This allows us to modify all non-application requests to a different base server
    if (settings.get('baseUrl')) {
      BaseServerModifier.configure(/** @type {string} */ (settings.get('baseUrl')));
    }

    // Wait for the theme to be set before bootstrapping angular
    ThemeSettings.setTheme().then(() => {
      // Theme loaded - bootstrap Angular.
      if (this.ngAppSelector && this.ngAppModule) {
        var bootstrapEl = document.querySelector(this.ngAppSelector);
        angular.element(bootstrapEl).ready(() => {
          angular.bootstrap(bootstrapEl, [this.ngAppModule]);

          // On settings change, update the theme
          settings.listen(Keys.THEME, ThemeSettings.updateTheme, false, this);
          settings.listen(Keys.ACCESSIBLE_THEME, ThemeSettings.updateTheme, false, this);
        });
      }
    }, (error) => {
      // Theme failed to load, which will result in a blank page. Throw an error so something shows up in the console.
      if (typeof error === 'string') {
        throw new Error(error);
      } else {
        throw new Error('Failed loading application theme: unspecified error.');
      }
    });
  }
}
