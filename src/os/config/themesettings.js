goog.provide('os.config.ThemeSettings');
goog.provide('os.config.ThemeSettingsChangeEvent');
goog.provide('os.config.ThemeSettingsCtrl');
goog.require('goog.Promise');
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

    // The theme that is displayed to the user
    var displayTheme = os.settings.get(os.config.ThemeSettings.keys.THEME, 'none');

    // The actual theme filename
    var theme = os.settings.get(os.config.ThemeSettings.keys.THEMES, {})[displayTheme];

    // If there is a theme specified, use it! otherwise just use what comes with the application
    if (goog.isDef(theme)) {
      // No theme is the default theme
      if (!theme) {
        theme = 'default';
      }

      // The url to the new theme
      var cssFile = ssEl.href.replace(themeRegEx, '$1' + theme + '$2');
      if (ssEl.href != cssFile) {
        // Awesome! lets load it!
        os.config.ThemeSettingsChangeEventTheme(cssFile).then(function() {
          resolve();
        });
      } else {
        resolve();
      }
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
    // onload doesnt work correctly for link for all browsers. Theres a hacky workaround to use img to to know when
    // the css is loaded
    var link = $('<link rel="stylesheet" type="text/css" href="' + cssFile + '"></link>');
    $('head').append(link);
    var img = document.createElement('img');

    /**
     * Failproof way to check if the css is loaded
     */
    img.onerror = function() {
      document.body.removeChild(img);

      if (os.ui.injector) {
        os.ui.injector.get('$timeout')(function() {
          os.config.ThemeSettings.themeUpdated();
          resolve();
        }, 200);
      } else {
        os.config.ThemeSettings.themeUpdated();
        resolve();
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
