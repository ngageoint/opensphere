goog.provide('os.config.ThemeSettings');
goog.provide('os.config.ThemeSettingsChangeEvent');
goog.provide('os.config.ThemeSettingsCtrl');

goog.require('goog.Promise');
goog.require('goog.async.ConditionalDelay');
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
os.config.ThemeSettings.LOADED_THEME_HTML = '<div class="' + os.config.ThemeSettings.LOADED_THEME_CLASS +
    '" style="display: none;"></div>';


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
      os.config.ThemeSettingsChangeEventTheme(cssFile, theme).then(function() {
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
          os.config.ThemeSettings.themeUpdated();
          resolve();
        }, 200);
      } else {
        // Angular isn't bootstrapped, so update the theme and resolve.
        os.config.ThemeSettings.themeUpdated();
        resolve();
      }
    };

    /**
     * Theme load failure handler.
     */
    delay.onFailure = function() {
      reject();
    };

    delay.start(10, 5000);
  });
};


/**
 * Check if a theme has been loaded.
 * @param {string} theme The theme name.
 * @return {boolean} If the theme is currently loaded.
 */
os.config.ThemeSettings.isThemeLoaded = function(theme) {
  // The theme has been loaded when the test element's content is set to the theme name.
  var el = os.config.ThemeSettings.getDetectionElement();
  if (el && el.length) {
    var content = el.css('content') || '';
    return content.replace(/^"(.*)"$/, '$1') === theme;
  }

  return false;
};


/**
 * Adds an element to the DOM that can be used to detect which theme is currently loaded.
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
