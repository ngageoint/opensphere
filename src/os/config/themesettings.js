goog.provide('os.config.ThemeSettings');
goog.provide('os.config.ThemeSettingsChangeEvent');
goog.provide('os.config.ThemeSettingsCtrl');

goog.require('goog.Promise');
goog.require('goog.async.ConditionalDelay');
goog.require('goog.dom.safe');
goog.require('goog.events.Event');
goog.require('ol.array');
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
  THEMES: 'themes',
  ACCESSIBLE_THEMES: 'accessible_themes',
  ACCESSIBLE_THEME: 'accessible_theme'
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
  'Default': 'overrides_slate_compact'
};


/**
 * Class used to indicate which theme is loaded and applied to the DOM.
 * @type {string}
 * @const
 */
os.config.ThemeSettings.LOADED_THEME_CLASS = 'u-loaded-theme';


/**
 * HTML for an element to detect which theme is currently loaded.
 * @type {string}
 * @const
 */
os.config.ThemeSettings.LOADED_THEME_HTML =
    '<div class="' + os.config.ThemeSettings.LOADED_THEME_CLASS + '" style="position: absolute; left: -9999px"></div>';


/**
 * The unit settings UI directive
 *
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
 *
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
   * @type {Object<string>}
   */
  this['accessibleThemes'] = os.settings.get(os.config.ThemeSettings.Keys.ACCESSIBLE_THEMES, {});

  /**
   * @type {string}
   */
  this['theme'] = os.settings.get(os.config.ThemeSettings.Keys.THEME, os.config.ThemeSettings.DEFAULT_THEME);

  /**
   * @type {string}
   */
  this['accessibleTheme'] = os.settings.get(os.config.ThemeSettings.Keys.ACCESSIBLE_THEME);

  /**
   * @type {boolean}
   */
  this['showAccessibleThemes'] = this['accessibleTheme'] ? true : false;

  /**
   * @type {string}
   */
  this['accessibilitySupportPage'] = os.settings.get('accessibilitySupportPage');

  os.settings.listen(os.config.ThemeSettings.Keys.THEME, this.onSettingsChange_, false, this);
  os.settings.listen(os.config.ThemeSettings.Keys.ACCESSIBLE_THEME, this.onAccessibilitySettingsChange_, false, this);
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * @private
 */
os.config.ThemeSettingsCtrl.prototype.destroy_ = function() {
  os.settings.unlisten(os.config.ThemeSettings.Keys.THEME, this.onSettingsChange_, false, this);
  os.settings.unlisten(os.config.ThemeSettings.Keys.ACCESSIBLE_THEME, this.onAccessibilitySettingsChange_, false, this);
  this.scope_ = null;
};


/**
 * Handle units change via settings.
 *
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
 * Handle units change via settings.
 *
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
os.config.ThemeSettingsCtrl.prototype.onAccessibilitySettingsChange_ = function(event) {
  if (event.newVal && event.newVal !== this['accessibleTheme']) {
    this['accessibleTheme'] = event.newVal;
    os.ui.apply(this.scope_);
  }
};


/**
 * Save to settings.
 *
 * @param {string} newVal
 * @param {string} oldVal
 * @export
 */
os.config.ThemeSettingsCtrl.prototype.onThemeChange = function(newVal, oldVal) {
  if (newVal != this['theme']) {
    os.settings.set(os.config.ThemeSettings.Keys.THEME, this['theme']);
  }
};


/**
 * Save to settings.
 *
 * @param {string} newVal
 * @param {string} oldVal
 * @export
 */
os.config.ThemeSettingsCtrl.prototype.onAccessableThemeChange = function(newVal, oldVal) {
  os.settings.set(os.config.ThemeSettings.Keys.ACCESSIBLE_THEME, this['accessibleTheme']);
};


/**
 * Keep track of the theme loading promise so we arent loading multiple themes at one time
 * @type {?goog.Promise}
 */
os.config.ThemeSettings.loadingPromise = null;


/**
 * Allows overriding application theme for certain routes
 * @type {Object}
 */
os.config.ThemeSettings.themeExceptions = {};


/**
 * Set Theme
 *
 * @return {goog.Promise}
 */
os.config.ThemeSettings.setTheme = function() {
  return new goog.Promise(function(resolve, reject) {
    var themeRegEx = /(themes\/).*?(\..*\.css)/;
    var stylesheets = document.querySelectorAll('[rel=stylesheet]');
    var ssEl;

    for (var i = 0; i < stylesheets.length; i++) {
      var el = stylesheets[i];
      if (el && themeRegEx.test(el.href)) {
        ssEl = el;
        break;
      }
    }

    if (!ssEl) {
      reject('Failed loading the application theme: theme style element is missing.');
      return;
    }

    // The currently selected theme.
    var displayTheme = os.settings.get(os.config.ThemeSettings.Keys.THEME, os.config.ThemeSettings.DEFAULT_THEME);
    var accessibleTheme = os.settings.get(os.config.ThemeSettings.Keys.ACCESSIBLE_THEME);

    // The application's configured themes.
    var themes = os.settings.get(os.config.ThemeSettings.Keys.THEMES, os.config.ThemeSettings.DEFAULT_THEMES);
    var accessibleThemes = os.settings.get(os.config.ThemeSettings.Keys.ACCESSIBLE_THEMES, {});

    // If the theme is not defined in settings, use the default.
    // This is most likely to happen when configured themes are changed.
    if (!themes[displayTheme]) {
      displayTheme = os.config.ThemeSettings.DEFAULT_THEME;
      accessibleTheme = null;
      os.settings.set(os.config.ThemeSettings.Keys.THEME, displayTheme);
      os.settings.set(os.config.ThemeSettings.Keys.ACCESSIBLE_THEME, accessibleTheme);
    }

    var theme = null;
    var exceptionTheme = goog.object.findValue(os.config.ThemeSettings.themeExceptions, function(value, key) {
      return window.location.hash.indexOf(key) != -1;
    });

    if (exceptionTheme) {
      if (accessibleTheme && accessibleThemes[exceptionTheme]) {
        // Get this flavor of the theme
        theme = accessibleThemes[exceptionTheme][accessibleTheme];
      } else {
        theme = accessibleThemes[exceptionTheme]['Normal'];
      }
    } else if (accessibleTheme && accessibleThemes[displayTheme]) {
      // Get this flavor of the theme
      theme = accessibleThemes[displayTheme][accessibleTheme];
    }

    // Couldnt find the accessible theme..
    if (!theme) {
      // The theme's stylesheet name.
      theme = themes[displayTheme];
    }

    // Check to see if there is also an accessible theme selected
    if (!theme) {
      reject('Failed loading the application theme: default theme is missing.');
      return;
    }

    // The URL to the theme's stylesheet.
    var cssFile = ssEl.href.replace(themeRegEx, '$1' + theme + '$2');
    if (ssEl.href != cssFile) {
      if (os.config.ThemeSettings.loadingPromise) {
        os.config.ThemeSettings.loadingPromise.cancel();
        os.config.ThemeSettings.loadingPromise = null;
      }

      // Awesome! lets load it!
      os.config.ThemeSettings.loadingPromise = os.config.ThemeSettingsChangeEventTheme(cssFile, theme).then(function() {
        os.config.ThemeSettings.loadingPromise = null;

        // Dont remove old themes until we have a good theme.
        // This prevents not having a theme if the promise is canceled
        os.config.ThemeSettings.themeUpdated();
        resolve();
      }, function(e) {
        if (e instanceof goog.Promise.CancellationError) {
          resolve();
        } else {
          os.config.ThemeSettings.loadingPromise = null;
          reject('Failed loading the application theme: could not load CSS for "' + cssFile + '".');
        }
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
 *
 * @param {string} cssFile The stylesheet URL.
 * @param {string} theme The stylesheet theme name.
 * @return {goog.Promise}
 */
os.config.ThemeSettingsChangeEventTheme = function(cssFile, theme) {
  return new goog.Promise(function(resolve, reject) {
    // Create and add the stylesheet to the DOM.
    var link = $('<link rel="stylesheet" type="text/css" href="' + cssFile + '"></link>');
    $('head').append(link);

    var delay = new goog.async.ConditionalDelay(os.config.ThemeSettings.isThemeLoaded.bind(undefined, theme));

    /**
     * Theme load success handler.
     */
    delay.onSuccess = function() {
      if (os.ui.injector) {
        // If Angular is loaded, use the $timeout service to update the theme outside the Angular lifecycle then apply
        // the scope.
        os.ui.injector.get('$timeout')(function() {
          resolve();
        }, 200);
      } else {
        // Angular isn't bootstrapped, so update the theme and resolve.
        resolve();
      }
    };

    /**
     * Theme load failure handler.
     */
    delay.onFailure = function() {
      reject();
    };

    delay.start(50, 15000);
  });
};


/**
 * Check if a theme has been loaded.
 *
 * @param {string} theme The theme name.
 * @return {boolean} If the theme is currently loaded.
 */
os.config.ThemeSettings.isThemeLoaded = function(theme) {
  // The theme has been loaded when the test element's content is set to the theme name.
  var el = os.config.ThemeSettings.getDetectionElement();
  if (el && el.length) {
    var content = window.getComputedStyle(el[0], ':before').content;
    return content.replace(/^['"](.*)['"]$/, '$1') === theme;
  }

  return false;
};


/**
 * Adds an element to the DOM that can be used to detect which theme is currently loaded.
 *
 * @return {jQuery} The detection element.
 */
os.config.ThemeSettings.getDetectionElement = function() {
  // Add an element to detect when the theme has been loaded.
  var el = $('.' + os.config.ThemeSettings.LOADED_THEME_CLASS);
  if (!el || !el.length) {
    el = $(os.config.ThemeSettings.LOADED_THEME_HTML);
    $('body').append(el);
  }

  return el;
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
    $(ourThemes[i]).remove();
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
