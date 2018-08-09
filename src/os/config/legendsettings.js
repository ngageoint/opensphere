goog.provide('os.config.LegendSettings');
goog.provide('os.config.LegendSettingsCtrl');

goog.require('goog.Disposable');
goog.require('os.defines');
goog.require('os.legend');
goog.require('os.ui.Module');
goog.require('os.ui.config.SettingPlugin');
goog.require('os.ui.events.UIEvent');
goog.require('os.ui.legendDirective');



/**
 * Screen capture legend settings.
 * @extends {os.ui.config.SettingPlugin}
 * @constructor
 */
os.config.LegendSettings = function() {
  os.config.LegendSettings.base(this, 'constructor');

  this.setLabel('Legend');
  this.setCategories(['Map']);
  this.setDescription('Display a data legend when capturing a screenshot or animated GIF');
  this.setIcon('fa ' + os.legend.ICON);
  this.setUI('legendsettings');
};
goog.inherits(os.config.LegendSettings, os.ui.config.SettingPlugin);


/**
 * @inheritDoc
 */
os.config.LegendSettings.prototype.getId = function() {
  return os.legend.ID;
};


/**
 * Legend settings keys.
 * @enum {string}
 */
os.config.LegendSetting = {
  // draw options
  BG_COLOR: os.legend.DRAW_OPTIONS_KEY + '.bgColor',
  BOLD: os.legend.DRAW_OPTIONS_KEY + '.bold',
  FONT_SIZE: os.legend.DRAW_OPTIONS_KEY + '.fontSize',
  SHOW_VECTOR: os.legend.DRAW_OPTIONS_KEY + '.showVector',
  SHOW_VECTOR_TYPE: os.legend.DRAW_OPTIONS_KEY + '.showVectorType',
  SHOW_COUNT: os.legend.DRAW_OPTIONS_KEY + '.showCount',
  SHOW_TILE: os.legend.DRAW_OPTIONS_KEY + '.showTile',
  SHOW_BACKGROUND: os.legend.DRAW_OPTIONS_KEY + '.showBackground',
  OPACITY: os.legend.DRAW_OPTIONS_KEY + '.opacity',

  // position settings
  TOP: os.legend.POSITION_KEY + '.top',
  LEFT: os.legend.POSITION_KEY + '.left'
};


/**
 * The legendsettings directive
 * @return {angular.Directive}
 */
os.config.legendSettingsDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/config/legendsettings.html',
    controller: os.config.LegendSettingsCtrl,
    controllerAs: 'legend'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('legendsettings', [os.config.legendSettingsDirective]);



/**
 * Controller function for the legendsettings directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$compile} $compile
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.config.LegendSettingsCtrl = function($scope, $element, $compile) {
  os.config.LegendSettingsCtrl.base(this, 'constructor');

  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;
  this.scope.$on('$destroy', this.dispose.bind(this));

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * @type {?angular.$compile}
   * @protected
   */
  this.compile = $compile;

  /**
   * The legend options.
   * @type {!osx.legend.LegendOptions}
   */
  this['options'] = os.legend.getOptionsFromSettings();

  if (os.config.LegendSettingsCtrl.FONT_SIZES.indexOf(this['options']['fontSize']) === -1) {
    this['options']['fontSize'] = os.legend.DEFAULT_OPTIONS.fontSize;
  }

  this.scope.$watch('legend.options.bgColor', this.onBgChange_.bind(this));
  this.scope.$watch('legend.options.showBackground', this.onShowBgChange_.bind(this));
  this.scope.$watch('legend.options.opacity', this.onOpacityChange_.bind(this));

  this.compilePlugins();
};
goog.inherits(os.config.LegendSettingsCtrl, goog.Disposable);


/**
 * Allowed font sizes for the legend.
 * @type {!Array<number>}
 * @const
 */
os.config.LegendSettingsCtrl.FONT_SIZES = [12, 14, 16, 20, 24, 32, 48, 64];


/**
 * @inheritDoc
 */
os.config.LegendSettingsCtrl.prototype.disposeInternal = function() {
  os.config.LegendSettingsCtrl.base(this, 'disposeInternal');

  this.compile = null;
  this.element = null;
  this.scope = null;
};


/**
 * Compile settings UI's for legend plugins.
 * @protected
 */
os.config.LegendSettingsCtrl.prototype.compilePlugins = function() {
  if (this.scope && this.element && this.compile) {
    var uiContainer = this.element.find('.js-legend-settings__plugin-options');
    uiContainer.children().remove();

    var html = '';
    os.legend.layerPlugins.forEach(function(p) {
      if (p.settingsUI) {
        if (p.settingsUI.indexOf('<') == -1) {
          // we were just given the directive name
          html += '<' + p.settingsUI + '></' + p.settingsUI + '>';
        } else {
          // we were given HTML
          html += p.settingsUI;
        }
      }
    }, this);

    uiContainer.html(html);
    this.compile(uiContainer.contents())(this.scope);
  }
};


/**
 * Open the legend.
 * @export
 */
os.config.LegendSettingsCtrl.prototype.openLegend = function() {
  var event = new os.ui.events.UIEvent(os.ui.events.UIEventType.TOGGLE_UI, os.legend.ID, true);
  os.dispatcher.dispatchEvent(event);
};


/**
 * Handle changes to legend background color.
 * @param {string} newVal
 * @param {string} oldVal
 * @private
 */
os.config.LegendSettingsCtrl.prototype.onBgChange_ = function(newVal, oldVal) {
  if (newVal !== oldVal) {
    os.settings.set(os.config.LegendSetting.BG_COLOR, this['options']['bgColor']);
    os.dispatcher.dispatchEvent(os.legend.EventType.UPDATE);
  }
};


/**
 * Handle changes to legend background color.
 * @param {string} newVal
 * @param {string} oldVal
 * @private
 */
os.config.LegendSettingsCtrl.prototype.onShowBgChange_ = function(newVal, oldVal) {
  if (newVal !== oldVal) {
    os.settings.set(os.config.LegendSetting.SHOW_BACKGROUND, this['options']['showBackground']);
    os.dispatcher.dispatchEvent(os.legend.EventType.UPDATE);
  }
};


/**
 * Handle changes to legend background color.
 * @param {string} newVal
 * @param {string} oldVal
 * @private
 */
os.config.LegendSettingsCtrl.prototype.onOpacityChange_ = function(newVal, oldVal) {
  if (newVal !== oldVal) {
    os.settings.set(os.config.LegendSetting.OPACITY, this['options']['opacity']);
    os.dispatcher.dispatchEvent(os.legend.EventType.UPDATE);
  }
};


/**
 * If the font size can be increased.
 * @return {boolean}
 */
os.config.LegendSettingsCtrl.prototype.canIncreaseFontSize = function() {
  var sizes = os.config.LegendSettingsCtrl.FONT_SIZES;
  return sizes.indexOf(this['options']['fontSize']) < sizes.length - 1;
};
goog.exportProperty(
    os.config.LegendSettingsCtrl.prototype,
    'canIncreaseFontSize',
    os.config.LegendSettingsCtrl.prototype.canIncreaseFontSize);


/**
 * If the font size can be increased.
 * @return {boolean}
 */
os.config.LegendSettingsCtrl.prototype.canDecreaseFontSize = function() {
  return os.config.LegendSettingsCtrl.FONT_SIZES.indexOf(this['options']['fontSize']) > 0;
};
goog.exportProperty(
    os.config.LegendSettingsCtrl.prototype,
    'canDecreaseFontSize',
    os.config.LegendSettingsCtrl.prototype.canDecreaseFontSize);


/**
 * Increases the font size used in the legend.
 */
os.config.LegendSettingsCtrl.prototype.increaseFontSize = function() {
  var idx = os.config.LegendSettingsCtrl.FONT_SIZES.indexOf(this['options']['fontSize']);
  if (idx != -1 && idx < os.config.LegendSettingsCtrl.FONT_SIZES.length - 1) {
    this['options']['fontSize'] = os.config.LegendSettingsCtrl.FONT_SIZES[++idx];
    os.settings.set(os.config.LegendSetting.FONT_SIZE, this['options']['fontSize']);
    os.dispatcher.dispatchEvent(os.legend.EventType.UPDATE);
  }
};
goog.exportProperty(
    os.config.LegendSettingsCtrl.prototype,
    'increaseFontSize',
    os.config.LegendSettingsCtrl.prototype.increaseFontSize);


/**
 * Decreases the font size used in the legend.
 */
os.config.LegendSettingsCtrl.prototype.decreaseFontSize = function() {
  var idx = os.config.LegendSettingsCtrl.FONT_SIZES.indexOf(this['options']['fontSize']);
  if (idx != -1 && idx > 0) {
    this['options']['fontSize'] = os.config.LegendSettingsCtrl.FONT_SIZES[--idx];
    os.settings.set(os.config.LegendSetting.FONT_SIZE, this['options']['fontSize']);
    os.dispatcher.dispatchEvent(os.legend.EventType.UPDATE);
  }
};
goog.exportProperty(
    os.config.LegendSettingsCtrl.prototype,
    'decreaseFontSize',
    os.config.LegendSettingsCtrl.prototype.decreaseFontSize);


/**
 * Toggles a boolean value and updates the value in settings.
 * @param {string} type
 */
os.config.LegendSettingsCtrl.prototype.toggle = function(type) {
  var settingKey = os.legend.DRAW_OPTIONS_KEY + '.' + type;
  os.settings.set(settingKey, this['options'][type]);
  os.dispatcher.dispatchEvent(os.legend.EventType.UPDATE);
};
goog.exportProperty(
    os.config.LegendSettingsCtrl.prototype,
    'toggle',
    os.config.LegendSettingsCtrl.prototype.toggle);


/**
 * Toggle the font bold setting.
 */
os.config.LegendSettingsCtrl.prototype.toggleBold = function() {
  this['options']['bold'] = !this['options']['bold'];
  this.toggle('bold');
};
goog.exportProperty(
    os.config.LegendSettingsCtrl.prototype,
    'toggleBold',
    os.config.LegendSettingsCtrl.prototype.toggleBold);
