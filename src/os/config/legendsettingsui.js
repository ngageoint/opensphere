goog.module('os.config.LegendSettingsUI');

const Disposable = goog.require('goog.Disposable');
const {ROOT} = goog.require('os');
const dispatcher = goog.require('os.Dispatcher');
const LegendSetting = goog.require('os.config.LegendSetting');
const {getSettings} = goog.require('os.config.instance');
const legend = goog.require('os.legend');
const {default: Module} = goog.require('os.ui.Module');
const {default: UIEvent} = goog.require('os.ui.events.UIEvent');
const {default: UIEventType} = goog.require('os.ui.events.UIEventType');


/**
 * The legendsettings directive
 *
 * @return {angular.Directive}
 */
const directive = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: ROOT + 'views/config/legendsettings.html',
    controller: Controller,
    controllerAs: 'legend'
  };
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'legendsettings';


/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);



/**
 * Controller function for the legendsettings directive
 * @unrestricted
 */
class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$compile} $compile
   * @ngInject
   */
  constructor($scope, $element, $compile) {
    super();

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
    this['options'] = legend.getOptionsFromSettings();

    if (Controller.FONT_SIZES.indexOf(this['options']['fontSize']) === -1) {
      this['options']['fontSize'] = legend.DEFAULT_OPTIONS.fontSize;
    }

    this.scope.$watch('legend.options.bgColor', this.onBgChange_.bind(this));
    this.scope.$watch('legend.options.showBackground', this.onShowBgChange_.bind(this));
    this.scope.$watch('legend.options.opacity', this.onOpacityChange_.bind(this));

    this.compilePlugins();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.compile = null;
    this.element = null;
    this.scope = null;
  }

  /**
   * Compile settings UI's for legend plugins.
   *
   * @protected
   */
  compilePlugins() {
    if (this.scope && this.element && this.compile) {
      var uiContainer = this.element.find('.js-legend-settings__plugin-options');
      uiContainer.children().remove();

      var html = '';
      legend.layerPlugins.forEach(function(p) {
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
  }

  /**
   * Open the legend.
   *
   * @export
   */
  openLegend() {
    var event = new UIEvent(UIEventType.TOGGLE_UI, legend.ID, true);
    dispatcher.getInstance().dispatchEvent(event);
  }

  /**
   * Handle changes to legend background color.
   *
   * @param {string} newVal
   * @param {string} oldVal
   * @private
   */
  onBgChange_(newVal, oldVal) {
    if (newVal !== oldVal) {
      getSettings().set(LegendSetting.BG_COLOR, this['options']['bgColor']);
      dispatcher.getInstance().dispatchEvent(legend.EventType.UPDATE);
    }
  }

  /**
   * Handle changes to legend background color.
   *
   * @param {string} newVal
   * @param {string} oldVal
   * @private
   */
  onShowBgChange_(newVal, oldVal) {
    if (newVal !== oldVal) {
      getSettings().set(LegendSetting.SHOW_BACKGROUND, this['options']['showBackground']);
      dispatcher.getInstance().dispatchEvent(legend.EventType.UPDATE);
    }
  }

  /**
   * Handle changes to legend background color.
   *
   * @param {string} newVal
   * @param {string} oldVal
   * @private
   */
  onOpacityChange_(newVal, oldVal) {
    if (newVal !== oldVal) {
      getSettings().set(LegendSetting.OPACITY, this['options']['opacity']);
      dispatcher.getInstance().dispatchEvent(legend.EventType.UPDATE);
    }
  }

  /**
   * If the font size can be increased.
   *
   * @return {boolean}
   * @export
   */
  canIncreaseFontSize() {
    var sizes = Controller.FONT_SIZES;
    return sizes.indexOf(this['options']['fontSize']) < sizes.length - 1;
  }

  /**
   * If the font size can be increased.
   *
   * @return {boolean}
   * @export
   */
  canDecreaseFontSize() {
    return Controller.FONT_SIZES.indexOf(this['options']['fontSize']) > 0;
  }

  /**
   * Increases the font size used in the legend.
   *
   * @export
   */
  increaseFontSize() {
    var idx = Controller.FONT_SIZES.indexOf(this['options']['fontSize']);
    if (idx != -1 && idx < Controller.FONT_SIZES.length - 1) {
      this['options']['fontSize'] = Controller.FONT_SIZES[++idx];
      getSettings().set(LegendSetting.FONT_SIZE, this['options']['fontSize']);
      dispatcher.getInstance().dispatchEvent(legend.EventType.UPDATE);
    }
  }

  /**
   * Decreases the font size used in the legend.
   *
   * @export
   */
  decreaseFontSize() {
    var idx = Controller.FONT_SIZES.indexOf(this['options']['fontSize']);
    if (idx != -1 && idx > 0) {
      this['options']['fontSize'] = Controller.FONT_SIZES[--idx];
      getSettings().set(LegendSetting.FONT_SIZE, this['options']['fontSize']);
      dispatcher.getInstance().dispatchEvent(legend.EventType.UPDATE);
    }
  }

  /**
   * Toggles a boolean value and updates the value in settings.
   *
   * @param {string} type
   * @export
   */
  toggle(type) {
    var settingKey = legend.DRAW_OPTIONS_KEY + '.' + type;
    getSettings().set(settingKey, this['options'][type]);
    dispatcher.getInstance().dispatchEvent(legend.EventType.UPDATE);
  }

  /**
   * Toggle the font bold setting.
   *
   * @export
   */
  toggleBold() {
    this['options']['bold'] = !this['options']['bold'];
    this.toggle('bold');
  }
}


/**
 * Allowed font sizes for the legend.
 * @type {!Array<number>}
 * @const
 */
Controller.FONT_SIZES = [12, 14, 16, 20, 24, 32, 48, 64];


exports = {
  directive,
  directiveTag,
  Controller
};
