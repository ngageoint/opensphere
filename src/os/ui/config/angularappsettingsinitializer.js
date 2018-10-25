goog.provide('os.ui.config.AngularAppSettingsInitializer');
goog.require('os.config.AbstractSettingsInitializer');
goog.require('os.config.ThemeSettings');



/**
 * @extends {os.config.AbstractSettingsInitializer}
 * @constructor
 */
os.ui.config.AngularAppSettingsInitializer = function() {
  os.ui.config.AngularAppSettingsInitializer.base(this, 'constructor');

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
};
goog.inherits(os.ui.config.AngularAppSettingsInitializer, os.config.AbstractSettingsInitializer);


/**
 * Check if the browser has required features to run the application.
 * @return {boolean}
 * @protected
 */
os.ui.config.AngularAppSettingsInitializer.prototype.isBrowserSupported = function() {
  return Boolean(Modernizr && Modernizr.canvas && Modernizr.localstorage && Modernizr.sessionstorage &&
      Modernizr.boxshadow && Modernizr.svg && Modernizr.rgba && Modernizr.webworkers);
};


/**
 * @inheritDoc
 */
os.ui.config.AngularAppSettingsInitializer.prototype.onSettingsLoaded = function() {
  // Wait for the theme to be set before bootstrapping angular
  os.config.ThemeSettings.setTheme().then(function() {
    // Theme loaded - bootstrap Angular.
    if (this.ngAppSelector && this.ngAppModule) {
      var bootstrapEl = document.querySelector(this.ngAppSelector);
      angular.element(bootstrapEl).ready(goog.bind(function() {
        angular.bootstrap(bootstrapEl, [this.ngAppModule]);

        // On settings change, update the theme
        os.settings.listen(os.config.ThemeSettings.Keys.THEME, os.config.ThemeSettings.updateTheme, false, this);
      }, this));
    }
  }, function(error) {
    // Theme failed to load, which will result in a blank page. Throw an error so something shows up in the console.
    if (typeof error === 'string') {
      throw new Error(error);
    } else {
      throw new Error('Failed loading application theme: unspecified error.');
    }
  }, this);
};
