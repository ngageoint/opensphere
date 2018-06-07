goog.provide('os.config.ThemeSettings');
goog.provide('os.config.ThemeSettingsChangeEvent');
goog.provide('os.config.ThemeSettingsCtrl');

goog.require('goog.Promise');
goog.require('goog.dom.safe');
goog.require('goog.events.Event');
goog.require('os.config.Settings');
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
os.config.ThemeSettings.Keys = {
  THEME: 'theme', // NOTE: this is in namespace.js as a cross application core setting. If you change it update there.
  THEMES: 'themes'
};


/**
 * The default theme name.
 * @type {string}
 * @const
 */
os.config.ThemeSettings.DEFAULT_THEME = 'Default';


/**
 * Default `themes` setting object. This should always be in config, so this is intended to be a fail-safe. If the
 * default theme changes in config, please update this.
 * @type {!Object<string, string>}
 * @const
 */
os.config.ThemeSettings.DEFAULT_THEMES = {
  'Default': 'overrides_darkly_compact'
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
  this['themes'] = os.settings.get(os.config.ThemeSettings.Keys.THEMES, os.config.ThemeSettings.DEFAULT_THEMES);

  /**
   * @type {string}
   */
  this['theme'] = os.settings.get(os.config.ThemeSettings.Keys.THEME, os.config.ThemeSettings.DEFAULT_THEME);

  os.settings.listen(os.config.ThemeSettings.Keys.THEME, this.onSettingsChange_, false, this);
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * @private
 */
os.config.ThemeSettingsCtrl.prototype.destroy_ = function() {
  os.settings.unlisten(os.config.ThemeSettings.Keys.THEME, this.onSettingsChange_, false, this);
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
    os.settings.set(os.config.ThemeSettings.Keys.THEME, this['theme']);
  }
};
goog.exportProperty(
    os.config.ThemeSettingsCtrl.prototype,
    'onThemeChange',
    os.config.ThemeSettingsCtrl.prototype.onThemeChange);


/**
 * Set Theme
 * @return {goog.Promise}
 */
os.config.ThemeSettings.setTheme = function() {
  return new goog.Promise(function(resolve, reject) {
    var themeRegEx = /(themes\/).*?(\..*\.css)/;
    var stylesheets = $('[rel=stylesheet]');
    var ssEl = goog.array.find(stylesheets, function(el) {
      return themeRegEx.test(el.href);
    });

    // The currently selected theme.
    var displayTheme = os.settings.get(os.config.ThemeSettings.Keys.THEME, os.config.ThemeSettings.DEFAULT_THEME);

    // The application's configured themes.
    var themes = os.settings.get(os.config.ThemeSettings.Keys.THEMES, os.config.ThemeSettings.DEFAULT_THEMES);

    // If the theme is not defined in settings, use the default. This is most likely to happen when configured themes
    // are changed.
    if (!themes[displayTheme]) {
      displayTheme = os.config.ThemeSettings.DEFAULT_THEME;
      os.settings.set(os.config.ThemeSettings.Keys.THEME, displayTheme);
    }

    // The theme's stylesheet name.
    var theme = themes[displayTheme];
    if (!theme) {
      reject('Failed loading the application theme: default theme is missing.');
      return;
    }

    // The URL to the theme's stylesheet.
    var cssFile = ssEl.href.replace(themeRegEx, '$1' + theme + '$2');
    if (ssEl.href != cssFile) {
      // Awesome! lets load it!
      os.config.ThemeSettingsChangeEventTheme(cssFile).then(function() {
        resolve();
      }, function() {
        reject('Failed loading the application theme: could not load CSS for "' + cssFile + '".');
      });
    } else {
      resolve();
    }
  });
};


/**
 * On settings update, set the theme.
 */
os.config.ThemeSettings.updateTheme = function() {
  os.config.ThemeSettings.setTheme();
};


/**
 * Change the stylesheet
 * @param {string} cssFile
 * @return {goog.Promise}
 */
os.config.ThemeSettingsChangeEventTheme = function(cssFile) {
  return new goog.Promise(function(resolve, reject) {
    // Create an add the stylesheet to the DOM.
    var link = $('<link rel="stylesheet" type="text/css" href="' + cssFile + '"></link>');
    $('head').append(link);

    // link.onload doesnt work correctly in browsers. As a hacky workaround, load the stylesheet as an image an use the
    // onerror handler to detect that the load completed.
    var img = document.createElement('img');

    /**
     * Workaround for link.onload not working correctly in various browsers.
     */
    img.onerror = function() {
      document.body.removeChild(img);

      // Detecting stylesheet loading still isn't an exact science, and sometimes the file will be available but not
      // fully loaded. This causes some styles to be absent when the DOM is rendered, and is most comment when using a
      // debug build.
      if (os.ui.injector) {
        os.ui.injector.get('$timeout')(function() {
          os.config.ThemeSettings.themeUpdated();
          resolve();
        }, 200);
      } else {
        setTimeout(function() {
          os.config.ThemeSettings.themeUpdated();
          resolve();
        }, 200);
      }
    };

    document.body.appendChild(img);
    img.src = cssFile;
  });
};


/**
 * Fired after the theme is done loading
 */
os.config.ThemeSettings.themeUpdated = function() {
  // Get the current theme(s)
  var themeRegEx = /(themes\/).*?(\..*\.css)/;
  var stylesheets = $('[rel=stylesheet]');
  var ourThemes = goog.array.filter(stylesheets, function(el) {
    return themeRegEx.test(el.href);
  });

  for (var i = 0; i < ourThemes.length - 1; i++) {
    ourThemes[i].remove();
  }

  if (os.dispatcher) {
    os.dispatcher.dispatchEvent(new goog.events.Event(os.config.ThemeSettingsChangeEvent));
  }
};


/**
 * If anything reacts to a theme change, update
 * @type {string}
 */
os.config.ThemeSettingsChangeEvent = 'theme.changed';
