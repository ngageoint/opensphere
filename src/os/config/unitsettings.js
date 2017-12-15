goog.provide('os.config.UnitSettings');
goog.provide('os.config.UnitSettingsCtrl');

goog.require('goog.userAgent');
goog.require('os.defines');
goog.require('os.map');
goog.require('os.ui.config.SettingPlugin');
goog.require('os.ui.location.SimpleLocationControlsCtrl');
goog.require('os.ui.util.LinkyFilter');



/**
 * @extends {os.ui.config.SettingPlugin}
 * @constructor
 */
os.config.UnitSettings = function() {
  os.config.UnitSettings.base(this, 'constructor');

  this.setLabel('Units');
  this.setCategories(['Map']);
  this.setDescription('Units of Measure');
  this.setTags(['Metric', 'Imperial', 'Nautical']);
  this.setIcon('fa fa-calculator');
  this.setUI('unitsettings');
};
goog.inherits(os.config.UnitSettings, os.ui.config.SettingPlugin);


/**
 * The unit settings UI directive
 * @return {angular.Directive}
 */
os.config.unitSettingsDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/config/unitsettings.html',
    controller: os.config.UnitSettingsCtrl,
    controllerAs: 'unitsCtrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('unitsettings', [os.config.unitSettingsDirective]);



/**
 * Controller for unit settings
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.config.UnitSettingsCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {os.unit.UnitManager}
   * @private
   */
  this.unitManager_ = os.unit.UnitManager.getInstance();
  this.unitManager_.listen(goog.events.EventType.PROPERTYCHANGE, this.onUnitsChange_, false, this);
  var systems = this.unitManager_.getFullSystems();
  this['allUnits'] = [];

  for (var system in systems) {
    var sys = systems[system]['distance'];
    if (sys) {
      this['allUnits'].push({
        'title': sys.getTitle(),
        'system': sys.getSystem()
      });
    }
  }
  // initialize units from settings
  this['units'] = this.unitManager_.getSelectedSystem();
  this.scope_.$watch('unitsCtrl.units', this.updateUnits_.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * @private
 */
os.config.UnitSettingsCtrl.prototype.destroy_ = function() {
  this.unitManager_.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onUnitsChange_, false, this);
  this.unitManager_ = null;
  this.scope_ = null;
};


/**
 * Handle units change via settings.
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
os.config.UnitSettingsCtrl.prototype.onUnitsChange_ = function(event) {
  var newVal = event.getNewValue();
  if (newVal && newVal !== this['units']) {
    this['units'] = newVal;
    os.ui.apply(this.scope_);
  }
};


/**
 * Save the new units settings.
 * @param {string=} opt_new
 * @param {string=} opt_old
 * @private
 */
os.config.UnitSettingsCtrl.prototype.updateUnits_ = function(opt_new, opt_old) {
  if (this.unitManager_ && opt_new && opt_old && opt_new !== opt_old) {
    this.unitManager_.setSelectedSystem(opt_new);
  }
};
