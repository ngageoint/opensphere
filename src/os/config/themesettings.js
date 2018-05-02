goog.provide('os.config.ThemeSettings');
goog.provide('os.config.ThemeSettingsCtrl');

goog.require('goog.Promise');
goog.require('os.config.Settings');
goog.require('os.net.Request');
goog.require('os.ui.config.SettingPlugin');



/**
 * @extends {os.ui.config.SettingPlugin}
 * @constructor
 */
os.config.ThemeSettings = function() {
  os.config.ThemeSettings.base(this, 'constructor');

  this.setLabel('Theme');
  this.setDescription('Set Application Theme');
  this.setTags(['Theme']);
  this.setIcon('fa fa-paint-brush');
  this.setUI('themesettings');
};
goog.inherits(os.config.ThemeSettings, os.ui.config.SettingPlugin);


/**
 * @enum {string}
 */
os.config.ThemeSettings.keys = {
  NONE: 'none',
  THEME: 'theme', // NOTE: this is in namespace.js as a cross application core setting. If you change it update there.
  THEMES: 'themes'
};


/**
 * The unit settings UI directive
 * @return {angular.Directive}
 */
os.config.ThemeSettingsDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/config/themesettings.html',
    controller: os.config.ThemeSettingsCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('themesettings', [os.config.ThemeSettingsDirective]);



/**
 * Controller for unit settings
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.config.ThemeSettingsCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {Object<string>}
   */
  this['themes'] = os.settings.get(os.config.ThemeSettings.keys.THEMES, {});
  // Remove the no theme option from the list to pick from
  goog.object.remove(this['themes'], os.config.ThemeSettings.keys.NONE);

  /**
   * @type {string}
   */
  this['theme'] = os.settings.get(os.config.ThemeSettings.keys.THEME, '');

  os.settings.listen(os.config.ThemeSettings.keys.THEME, this.onSettingsChange_, false, this);
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * @private
 */
os.config.ThemeSettingsCtrl.prototype.destroy_ = function() {
  os.settings.unlisten(os.config.ThemeSettings.keys.THEME, this.onSettingsChange_, false, this);
  this.scope_ = null;
};


/**
 * Handle units change via settings.
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
os.config.ThemeSettingsCtrl.prototype.onSettingsChange_ = function(event) {
  if (event.newVal && event.newVal !== this['theme']) {
    this['theme'] = event.newVal;
    os.ui.apply(this.scope_);
  }
};


/**
 * Save to settings.
 * @param {string} newVal
 * @param {string} oldVal
 */
os.config.ThemeSettingsCtrl.prototype.onThemeChange = function(newVal, oldVal) {
  if (newVal != this['theme']) {
    os.settings.set(os.config.ThemeSettings.keys.THEME, this['theme']);
  }
};
goog.exportProperty(
    os.config.ThemeSettingsCtrl.prototype,
    'onThemeChange',
    os.config.ThemeSettingsCtrl.prototype.onThemeChange);


/**
 * The original stylesheet deployed with the application. Used as extreme backup if theres bad network connection
 * @type {string}
 */
os.config.ThemeSettings.originalStylesheet = '';


/**
 * Set Theme
 * @return {goog.Promise}
 */
os.config.ThemeSettings.setTheme = function() {
  var themeRegEx = /(themes\/).*?(\..*\.css)/;
  var stylesheets = $('[rel=stylesheet]');
  var ssEl = goog.array.find(stylesheets, function(el) {
    return themeRegEx.test(el.href);
  });

  if (ssEl) {
    return new goog.Promise(function(resolve, reject) {
      // Save off the original stylesheet incase the network is having trouble getting others
      if (!os.config.ThemeSettings.originalStylesheet) {
        os.config.ThemeSettings.originalStylesheet = ssEl.href;
      }

      // The theme that is displayed to the user
      var displayTheme = os.settings.get(os.config.ThemeSettings.keys.THEME, 'none');

      // The actual theme filename
      var theme = os.settings.get(os.config.ThemeSettings.keys.THEMES, {})[displayTheme];

      // If there is a theme specified, use it! otherwise just use what comes with the application
      if (goog.isDef(theme)) {
        // The url to the new theme
        var cssFile = ssEl.href.replace(themeRegEx, '$1' + theme + '$2');
        var backupCssFile = ssEl.href;

        // Ok lets trust but verify that the stylesheet is good. Otherwise you see a flicker when loading the app
        // loading a non-default stylesheet
        if (ssEl.href != cssFile) {
          // Awesome! lets load it!
          os.config.ThemeSettings.changeTheme(ssEl, cssFile, backupCssFile, resolve);
        }
      } else {
        resolve();
      }
    });
  } else {
    return goog.Promise.resolve();
  }
};


/**
 * On settings update, set the theme.
 */
os.config.ThemeSettings.updateTheme = function() {
  os.config.ThemeSettings.setTheme();
};


/**
 * Clean up the request for the stylesheet
 * @param {goog.events.Event} event
 */
os.config.ThemeSettings.cleanupRequest = function(event) {
  /** @type {os.net.Request} */ (event.target).dispose();
};


/**
 * Change the stylesheet
 * @param {!HTMLLinkElement} ssEl
 * @param {string} cssFile
 * @param {string} backupCssFile
 * @param {function()} resolve - resolve the promise after the css is loaded
 */
os.config.ThemeSettings.changeTheme = function(ssEl, cssFile, backupCssFile, resolve) {
  var request = new os.net.Request();
  request.setUri(cssFile);
  request.listenOnce(goog.net.EventType.SUCCESS, function(event) {
    os.config.ThemeSettings.cleanupRequest(event);

    var link = $('<link />', {
      rel: 'stylesheet',
      type: 'text/css',
      href: cssFile
    });
    $('head').append(link);
    resolve();

    // If angular is already bootstraped. We want to wait for the new css file to load.
    // Otherwise its loaded so we are good
    if (os.ui.injector) {
      os.ui.injector.get('$timeout')(function() {
        ssEl.remove();
      }, 200);
    } else {
      ssEl.remove();
    }
  }, false);
  request.listenOnce(goog.net.EventType.ERROR, function(event) {
    os.config.ThemeSettings.cleanupRequest(event);

    // If we've already tried to load the backup and THAT failed. Then just bootstrap and hope for the best.
    // Should never happen (??)
    if (backupCssFile == os.config.ThemeSettings.originalStylesheet) {
      resolve();
    } else {
      // Revert!
      os.config.ThemeSettings.changeTheme(ssEl, backupCssFile, os.config.ThemeSettings.originalStylesheet, resolve);
    }
  }, false);
  request.load();
};
