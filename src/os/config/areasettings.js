goog.provide('os.config.AreaSettings');
goog.provide('os.config.AreaSettingsCtrl');

goog.require('os.defines');
goog.require('os.query.AreaManager');
goog.require('os.ui.Module');
goog.require('os.ui.config.SettingPlugin');



/**
 * @extends {os.ui.config.SettingPlugin}
 * @constructor
 */
os.config.AreaSettings = function() {
  os.config.AreaSettings.base(this, 'constructor');

  this.setLabel('Areas');
  this.setCategories(['Map']);
  this.setDescription('Options for Areas');
  this.setTags(['areas', 'color', 'width']);
  this.setIcon('fa fa-globe');
  this.setUI('areasettings');
};
goog.inherits(os.config.AreaSettings, os.ui.config.SettingPlugin);


/**
 * The area settings UI directive
 * @return {angular.Directive}
 */
os.config.areaSettingsDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/config/areasettings.html',
    controller: os.config.AreaSettingsCtrl,
    controllerAs: 'area'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('areasettings', [os.config.areaSettingsDirective]);



/**
 * Controller function for the areasettingss directive
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.config.AreaSettingsCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  os.settings.listen(os.query.AreaManager.KEYS.IN_COLOR, this.settingsInColorChange_, false, this);
  os.settings.listen(os.query.AreaManager.KEYS.IN_WIDTH, this.settingsInWidthChange_, false, this);
  os.settings.listen(os.query.AreaManager.KEYS.EX_COLOR, this.settingsExColorChange_, false, this);
  os.settings.listen(os.query.AreaManager.KEYS.EX_WIDTH, this.settingsExWidthChange_, false, this);

  this['inColor'] = os.settings.get(os.query.AreaManager.KEYS.IN_COLOR,
      os.query.AreaManager.DEFAULT.IN_COLOR);
  this['inWidth'] = parseInt(os.settings.get(os.query.AreaManager.KEYS.IN_WIDTH,
      os.query.AreaManager.DEFAULT.IN_WIDTH), 10) || 2;
  this['exColor'] = os.settings.get(os.query.AreaManager.KEYS.EX_COLOR,
      os.query.AreaManager.DEFAULT.EX_COLOR);
  this['exWidth'] = parseInt(os.settings.get(os.query.AreaManager.KEYS.EX_WIDTH,
      os.query.AreaManager.DEFAULT.EX_WIDTH), 10) || 2;

  this.scope_.$watch('area.inColor', this.onInColorChange_.bind(this));
  this.scope_.$watch('area.inWidth', this.onInWidthChange_.bind(this));
  this.scope_.$watch('area.exColor', this.onExColorChange_.bind(this));
  this.scope_.$watch('area.exWidth', this.onExWidthChange_.bind(this));

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * @private
 */
os.config.AreaSettingsCtrl.prototype.destroy_ = function() {
  os.settings.unlisten(os.query.AreaManager.KEYS.IN_COLOR, this.settingsInColorChange_, false, this);
  os.settings.unlisten(os.query.AreaManager.KEYS.IN_WIDTH, this.settingsInWidthChange_, false, this);
  os.settings.unlisten(os.query.AreaManager.KEYS.EX_COLOR, this.settingsExColorChange_, false, this);
  os.settings.unlisten(os.query.AreaManager.KEYS.EX_WIDTH, this.settingsExWidthChange_, false, this);

  this.scope_ = null;
};


/**
 * Handle Include Color changes via gui.
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.config.AreaSettingsCtrl.prototype.onInColorChange_ = function(event) {
  if (event) {
    os.settings.set(os.query.AreaManager.KEYS.IN_COLOR, this['inColor']);
    this.confirm_();
    os.ui.apply(this.scope_);
  }
};


/**
 * Handle Include Width changes via gui.
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.config.AreaSettingsCtrl.prototype.onInWidthChange_ = function(event) {
  if (event) {
    os.settings.set(os.query.AreaManager.KEYS.IN_WIDTH, this['inWidth']);
    this.confirm_();
    os.ui.apply(this.scope_);
  }
};


/**
 * Handle Exclude Color changes via gui.
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.config.AreaSettingsCtrl.prototype.onExColorChange_ = function(event) {
  if (event) {
    os.settings.set(os.query.AreaManager.KEYS.EX_COLOR, this['exColor']);
    this.confirm_();
    os.ui.apply(this.scope_);
  }
};


/**
 * Handle Exclude Width changes via gui.
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.config.AreaSettingsCtrl.prototype.onExWidthChange_ = function(event) {
  if (event) {
    os.settings.set(os.query.AreaManager.KEYS.EX_WIDTH, this['exWidth']);
    this.confirm_();
    os.ui.apply(this.scope_);
  }
};


/**
 * Handle Include Color changes via settings.
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.config.AreaSettingsCtrl.prototype.settingsInColorChange_ = function(event) {
  if (event.newVal && event.newVal != this['inColor']) {
    this['inColor'] = event.newVal;
    this.confirm_();
    os.ui.apply(this.scope_);
  }
};


/**
 * Handle Include Width changes via settings.
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.config.AreaSettingsCtrl.prototype.settingsInWidthChange_ = function(event) {
  if (event.newVal && event.newVal != this['inWidth']) {
    this['inWidth'] = parseInt(event.newVal, 10);
    this.confirm_();
    os.ui.apply(this.scope_);
  }
};


/**
 * Handle Exclude Color changes via settings.
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.config.AreaSettingsCtrl.prototype.settingsExColorChange_ = function(event) {
  if (event.newVal && event.newVal != this['exColor']) {
    this['exColor'] = event.newVal;
    this.confirm_();
    os.ui.apply(this.scope_);
  }
};


/**
 * Handle Exclude Width changes via settings.
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.config.AreaSettingsCtrl.prototype.settingsExWidthChange_ = function(event) {
  if (event.newVal && event.newVal != this['exWidth']) {
    this['exWidth'] = parseInt(event.newVal, 10);
    this.confirm_();
    os.ui.apply(this.scope_);
  }
};


/**
 * Fire the confirmation callback and close the window.
 * @private
 */
os.config.AreaSettingsCtrl.prototype.confirm_ = function() {
  os.query.AreaManager.FULL_INCLUSION_STYLE.stroke.color = this['inColor'];
  os.query.AreaManager.FULL_INCLUSION_STYLE.stroke.width = this['inWidth'];

  os.query.AreaManager.FULL_EXCLUSION_STYLE.stroke.color = this['exColor'];
  os.query.AreaManager.FULL_EXCLUSION_STYLE.stroke.width = this['exWidth'];

  var am = os.ui.query.AreaManager.getInstance();

  var areas = am.getAll();
  goog.array.forEach(areas, function(area) {
    if (goog.isDefAndNotNull(area.getStyle())) {
      var entries = os.ui.queryManager.getEntries(null, /** @type {string} */ (area.getId()));
      if (entries && entries.length > 0) {
        var expectedStyle = /** @type {boolean} */ (entries[0]['includeArea']) ?
            goog.object.unsafeClone(os.query.AreaManager.FULL_INCLUSION_STYLE) :
            goog.object.unsafeClone(os.query.AreaManager.FULL_EXCLUSION_STYLE);
        area.set(os.style.StyleType.SELECT, expectedStyle);
        os.style.setFeatureStyle(area);
        am.redraw(area);
      }
    }
  }, this);
};


/**
 * Resets to the default colors
 * @protected
 */
os.config.AreaSettingsCtrl.prototype.reset = function() {
  this['inColor'] = os.query.AreaManager.DEFAULT.IN_COLOR;
  this['inWidth'] = parseInt(os.query.AreaManager.DEFAULT.IN_WIDTH, 10) || 2;
  this['exColor'] = os.query.AreaManager.DEFAULT.EX_COLOR;
  this['exWidth'] = parseInt(os.query.AreaManager.DEFAULT.EX_WIDTH, 10) || 2;
  os.settings.set(os.query.AreaManager.KEYS.IN_COLOR, os.query.AreaManager.DEFAULT.IN_COLOR);
  os.settings.set(os.query.AreaManager.KEYS.IN_WIDTH, os.query.AreaManager.DEFAULT.IN_WIDTH);
  os.settings.set(os.query.AreaManager.KEYS.EX_COLOR, os.query.AreaManager.DEFAULT.EX_COLOR);
  os.settings.set(os.query.AreaManager.KEYS.EX_WIDTH, os.query.AreaManager.DEFAULT.EX_WIDTH);
  this.confirm_();
};
goog.exportProperty(os.config.AreaSettingsCtrl.prototype,
    'reset', os.config.AreaSettingsCtrl.prototype.reset);
