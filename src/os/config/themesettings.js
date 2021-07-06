goog.module('os.config.ThemeSettings');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const {filter} = goog.require('goog.array');
const ConditionalDelay = goog.require('goog.async.ConditionalDelay');
const GoogEvent = goog.require('goog.events.Event');
const {findValue} = goog.require('goog.object');
const dispatcher = goog.require('os.Dispatcher');
const ThemeSettingsChangeEvent = goog.require('os.config.ThemeSettingsChangeEvent');
const {directiveTag: settingsUi} = goog.require('os.config.ThemeSettingsUI');
const {getSettings} = goog.require('os.config.instance');
const {DEFAULT_THEME, DEFAULT_THEMES, Keys} = goog.require('os.config.theme');
const ui = goog.require('os.ui');
const SettingPlugin = goog.require('os.ui.config.SettingPlugin');

const SettingChangeEvent = goog.requireType('os.events.SettingChangeEvent');


/**
 * Class used to indicate which theme is loaded and applied to the DOM.
 * @type {string}
 */
const loadedThemeClass = 'u-loaded-theme';


/**
 * HTML for an element to detect which theme is currently loaded.
 * @type {string}
 */
const loadedThemeHtml = `<div class="${loadedThemeClass}" style="position: absolute; left: -9999px"></div>`;


/**
 * Keep track of the theme loading promise so we arent loading multiple themes at one time
 * @type {?Promise}
 */
let loadingPromise = null;


/**
 */
class ThemeSettings extends SettingPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.setLabel('Theme');
    this.setDescription('Set Application Theme');
    this.setTags(['Theme']);
    this.setIcon('fa fa-paint-brush');
    this.setUI(settingsUi);
  }

  /**
   * Set Theme
   *
   * @return {Promise}
   */
  static setTheme() {
    return new Promise(function(resolve, reject) {
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
      var displayTheme = getSettings().get(Keys.THEME, DEFAULT_THEME);
      var accessibleTheme = getSettings().get(Keys.ACCESSIBLE_THEME);

      // The application's configured themes.
      var themes = getSettings().get(Keys.THEMES, DEFAULT_THEMES);
      var accessibleThemes = getSettings().get(Keys.ACCESSIBLE_THEMES, {});

      // If the theme is not defined in settings, use the default.
      // This is most likely to happen when configured themes are changed.
      if (!themes[displayTheme]) {
        displayTheme = DEFAULT_THEME;
        accessibleTheme = null;
        getSettings().set(Keys.THEME, displayTheme);
        getSettings().set(Keys.ACCESSIBLE_THEME, accessibleTheme);
      }

      var theme = null;
      var exceptionTheme = findValue(ThemeSettings.themeExceptions, function(value, key) {
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
        if (loadingPromise) {
          loadingPromise.cancel();
          loadingPromise = null;
        }

        // Awesome! lets load it!
        loadingPromise = ThemeSettingsChangeEventTheme(cssFile, theme).then(function() {
          loadingPromise = null;

          // Dont remove old themes until we have a good theme.
          // This prevents not having a theme if the promise is canceled
          ThemeSettings.themeUpdated();
          resolve();
        }, function(e) {
          if (e instanceof Promise.CancellationError) {
            resolve();
          } else {
            loadingPromise = null;
            reject('Failed loading the application theme: could not load CSS for "' + cssFile + '".');
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * On settings update, set the theme.
   */
  static updateTheme() {
    ThemeSettings.setTheme();
  }

  /**
   * Check if a theme has been loaded.
   *
   * @param {string} theme The theme name.
   * @return {boolean} If the theme is currently loaded.
   */
  static isThemeLoaded(theme) {
    // The theme has been loaded when the test element's content is set to the theme name.
    var el = ThemeSettings.getDetectionElement();
    if (el && el.length) {
      var content = window.getComputedStyle(el[0], ':before').content;
      return content.replace(/^['"](.*)['"]$/, '$1') === theme;
    }

    return false;
  }

  /**
   * Adds an element to the DOM that can be used to detect which theme is currently loaded.
   *
   * @return {jQuery} The detection element.
   */
  static getDetectionElement() {
    // Add an element to detect when the theme has been loaded.
    var el = $('.' + loadedThemeClass);
    if (!el || !el.length) {
      el = $(loadedThemeHtml);
      $('body').append(el);
    }

    return el;
  }

  /**
   * Fired after the theme is done loading
   */
  static themeUpdated() {
    // Get the current theme(s)
    var themeRegEx = /(themes\/).*?(\..*\.css)/;
    var stylesheets = $('[rel=stylesheet]');
    var ourThemes = filter(stylesheets, function(el) {
      return themeRegEx.test(el.href);
    });

    for (var i = 0; i < ourThemes.length - 1; i++) {
      $(ourThemes[i]).remove();
    }

    if (dispatcher.getInstance()) {
      dispatcher.getInstance().dispatchEvent(new GoogEvent(ThemeSettingsChangeEvent));
    }
  }
}


/**
 * @enum {string}
 * @deprecated Please use os.config.theme.Keys instead.
 */
ThemeSettings.Keys = Keys;


/**
 * The default theme name.
 * @type {string}
 * @const
 * @deprecated Please use os.config.theme.DEFAULT_THEME instead.
 */
ThemeSettings.DEFAULT_THEME = DEFAULT_THEME;


/**
 * Default `themes` setting object. This should always be in config, so this is intended to be a fail-safe. If the
 * default theme changes in config, please update this.
 * @type {!Object<string, string>}
 * @const
 * @deprecated Please use os.config.theme.DEFAULT_THEMES instead.
 */
ThemeSettings.DEFAULT_THEMES = DEFAULT_THEMES;


/**
 * Allows overriding application theme for certain routes
 * @type {Object}
 */
ThemeSettings.themeExceptions = {};


/**
 * Change the stylesheet
 *
 * @param {string} cssFile The stylesheet URL.
 * @param {string} theme The stylesheet theme name.
 * @return {Promise}
 */
const ThemeSettingsChangeEventTheme = function(cssFile, theme) {
  return new Promise(function(resolve, reject) {
    // Create and add the stylesheet to the DOM.
    var link = $('<link rel="stylesheet" type="text/css" href="' + cssFile + '"></link>');
    $('head').append(link);

    var delay = new ConditionalDelay(ThemeSettings.isThemeLoaded.bind(undefined, theme));

    /**
     * Theme load success handler.
     */
    delay.onSuccess = function() {
      if (ui.injector) {
        // If Angular is loaded, use the $timeout service to update the theme outside the Angular lifecycle then apply
        // the scope.
        ui.injector.get('$timeout')(function() {
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


exports = ThemeSettings;
