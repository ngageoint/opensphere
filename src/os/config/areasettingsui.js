goog.module('os.config.AreaSettingsUI');

const {unsafeClone} = goog.require('goog.object');
const {ROOT} = goog.require('os');
const {getSettings} = goog.require('os.config.instance');
const AreaManager = goog.require('os.query.AreaManager');
const {getAreaManager, getQueryManager} = goog.require('os.query.instance');
const {setFeatureStyle} = goog.require('os.style');
const StyleType = goog.require('os.style.StyleType');
const {apply} = goog.require('os.ui');
const {default: Module} = goog.require('os.ui.Module');

const SettingChangeEvent = goog.requireType('os.events.SettingChangeEvent');


/**
 * The area settings UI directive
 * @return {angular.Directive}
 */
const directive = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: ROOT + 'views/config/areasettings.html',
    controller: Controller,
    controllerAs: 'area'
  };
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'areasettings';


/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);



/**
 * Controller function for the areasettingss directive
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    const settings = getSettings();
    settings.listen(AreaManager.KEYS.IN_COLOR, this.settingsInColorChange_, false, this);
    settings.listen(AreaManager.KEYS.IN_WIDTH, this.settingsInWidthChange_, false, this);
    settings.listen(AreaManager.KEYS.EX_COLOR, this.settingsExColorChange_, false, this);
    settings.listen(AreaManager.KEYS.EX_WIDTH, this.settingsExWidthChange_, false, this);

    this['inColor'] = settings.get(AreaManager.KEYS.IN_COLOR, AreaManager.DEFAULT.IN_COLOR);
    this['inWidth'] = parseInt(settings.get(AreaManager.KEYS.IN_WIDTH, AreaManager.DEFAULT.IN_WIDTH), 10) || 2;
    this['exColor'] = settings.get(AreaManager.KEYS.EX_COLOR, AreaManager.DEFAULT.EX_COLOR);
    this['exWidth'] = parseInt(settings.get(AreaManager.KEYS.EX_WIDTH, AreaManager.DEFAULT.EX_WIDTH), 10) || 2;

    this.scope_.$watch('area.inColor', this.onInColorChange_.bind(this));
    this.scope_.$watch('area.inWidth', this.onInWidthChange_.bind(this));
    this.scope_.$watch('area.exColor', this.onExColorChange_.bind(this));
    this.scope_.$watch('area.exWidth', this.onExWidthChange_.bind(this));

    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * @private
   */
  destroy_() {
    const settings = getSettings();
    settings.unlisten(AreaManager.KEYS.IN_COLOR, this.settingsInColorChange_, false, this);
    settings.unlisten(AreaManager.KEYS.IN_WIDTH, this.settingsInWidthChange_, false, this);
    settings.unlisten(AreaManager.KEYS.EX_COLOR, this.settingsExColorChange_, false, this);
    settings.unlisten(AreaManager.KEYS.EX_WIDTH, this.settingsExWidthChange_, false, this);

    this.scope_ = null;
  }

  /**
   * Handle Include Color changes via gui.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  onInColorChange_(event) {
    if (event) {
      getSettings().set(AreaManager.KEYS.IN_COLOR, this['inColor']);
      this.confirm_();
      apply(this.scope_);
    }
  }

  /**
   * Handle Include Width changes via gui.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  onInWidthChange_(event) {
    if (event) {
      getSettings().set(AreaManager.KEYS.IN_WIDTH, this['inWidth']);
      this.confirm_();
      apply(this.scope_);
    }
  }

  /**
   * Handle Exclude Color changes via gui.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  onExColorChange_(event) {
    if (event) {
      getSettings().set(AreaManager.KEYS.EX_COLOR, this['exColor']);
      this.confirm_();
      apply(this.scope_);
    }
  }

  /**
   * Handle Exclude Width changes via gui.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  onExWidthChange_(event) {
    if (event) {
      getSettings().set(AreaManager.KEYS.EX_WIDTH, this['exWidth']);
      this.confirm_();
      apply(this.scope_);
    }
  }

  /**
   * Handle Include Color changes via settings.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  settingsInColorChange_(event) {
    if (event.newVal && event.newVal != this['inColor']) {
      this['inColor'] = event.newVal;
      this.confirm_();
      apply(this.scope_);
    }
  }

  /**
   * Handle Include Width changes via settings.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  settingsInWidthChange_(event) {
    if (event.newVal && event.newVal != this['inWidth']) {
      this['inWidth'] = parseInt(event.newVal, 10);
      this.confirm_();
      apply(this.scope_);
    }
  }

  /**
   * Handle Exclude Color changes via settings.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  settingsExColorChange_(event) {
    if (event.newVal && event.newVal != this['exColor']) {
      this['exColor'] = event.newVal;
      this.confirm_();
      apply(this.scope_);
    }
  }

  /**
   * Handle Exclude Width changes via settings.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  settingsExWidthChange_(event) {
    if (event.newVal && event.newVal != this['exWidth']) {
      this['exWidth'] = parseInt(event.newVal, 10);
      this.confirm_();
      apply(this.scope_);
    }
  }

  /**
   * Fire the confirmation callback and close the window.
   *
   * @private
   */
  confirm_() {
    AreaManager.FULL_INCLUSION_STYLE.stroke.color = this['inColor'];
    AreaManager.FULL_INCLUSION_STYLE.stroke.width = this['inWidth'];

    AreaManager.FULL_EXCLUSION_STYLE.stroke.color = this['exColor'];
    AreaManager.FULL_EXCLUSION_STYLE.stroke.width = this['exWidth'];

    var am = getAreaManager();

    var areas = am.getAll();
    areas.forEach(function(area) {
      if (area.getStyle() != null) {
        var entries = getQueryManager().getEntries(null, /** @type {string} */ (area.getId()));
        if (entries && entries.length > 0) {
          var expectedStyle = /** @type {boolean} */ (entries[0]['includeArea']) ?
            unsafeClone(AreaManager.FULL_INCLUSION_STYLE) :
            unsafeClone(AreaManager.FULL_EXCLUSION_STYLE);
          area.set(StyleType.SELECT, expectedStyle);
          setFeatureStyle(area);
          am.redraw(area);
        }
      }
    }, this);
  }

  /**
   * Resets to the default colors
   *
   * @export
   */
  reset() {
    const settings = getSettings();

    this['inColor'] = AreaManager.DEFAULT.IN_COLOR;
    this['inWidth'] = parseInt(AreaManager.DEFAULT.IN_WIDTH, 10) || 2;
    this['exColor'] = AreaManager.DEFAULT.EX_COLOR;
    this['exWidth'] = parseInt(AreaManager.DEFAULT.EX_WIDTH, 10) || 2;

    settings.set(AreaManager.KEYS.IN_COLOR, AreaManager.DEFAULT.IN_COLOR);
    settings.set(AreaManager.KEYS.IN_WIDTH, AreaManager.DEFAULT.IN_WIDTH);
    settings.set(AreaManager.KEYS.EX_COLOR, AreaManager.DEFAULT.EX_COLOR);
    settings.set(AreaManager.KEYS.EX_WIDTH, AreaManager.DEFAULT.EX_WIDTH);

    this.confirm_();
  }
}

exports = {
  directive,
  directiveTag,
  Controller
};
