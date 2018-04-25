goog.provide('os.config.ThemeSettings');
goog.provide('os.config.ThemeSettingsCtrl');

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
  os.settings.set(os.config.ThemeSettings.keys.THEME, this['theme']);
};
goog.exportProperty(
    os.config.ThemeSettingsCtrl.prototype,
    'onThemeChange',
    os.config.ThemeSettingsCtrl.prototype.onThemeChange);


/**
 * Set Theme
 */
os.config.ThemeSettings.setTheme = function() {
  var themeRegEx = /(themes\/).*?(\..*\.css)/;
  var stylesheets = $('[rel=stylesheet]');
  var themeStylesheet = goog.array.find(stylesheets, function(el) {
    return themeRegEx.test(el.href);
  });

  // The theme that is displayed to the user
  var displayTheme = os.settings.get(os.config.ThemeSettings.keys.THEME, 'none');

  // The actual theme filename
  var theme = os.settings.get(os.config.ThemeSettings.keys.THEMES, {})[displayTheme];

  // If there is a theme specified, use it! otherwise just use what comes with the application
  if (theme) {
    // The url to the new theme
    var newStylesheet = themeStylesheet.href.replace(themeRegEx, '$1' + theme + '$2');
    var lastStylesheet = themeStylesheet.href;

    // Ok lets trust but verify that the stylesheet is good. Otherwise you see a flicker when loading the app
    // loading a non-default stylesheet
    if (themeStylesheet.href != newStylesheet) {
      // Awesome! lets load it!
      goog.dom.safe.setLinkHrefAndRel(themeStylesheet,
          goog.html.TrustedResourceUrl.fromConstant(os.string.createConstant(newStylesheet)), themeStylesheet.rel);
    }

    // Verify that it was good...
    var request = new os.net.Request();
    request.setUri(newStylesheet);
    request.listenOnce(goog.net.EventType.SUCCESS, os.config.ThemeSettings.cleanupRequest, false);
    request.listenOnce(goog.net.EventType.ERROR, function(event) {
      os.config.ThemeSettings.cleanupRequest(event);

      // Revert!
      goog.dom.safe.setLinkHrefAndRel(themeStylesheet,
          goog.html.TrustedResourceUrl.fromConstant(os.string.createConstant(lastStylesheet)), themeStylesheet.rel);
    }, false);
    request.load();
  }
};


/**
 * Clean up the request for the stylesheet
 * @param {goog.events.Event} event
 */
os.config.ThemeSettings.cleanupRequest = function(event) {
  /** @type {os.net.Request} */ (event.target).dispose();
};
