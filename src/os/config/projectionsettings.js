goog.provide('os.config.ProjectionSettings');
goog.provide('os.config.ProjectionSettingsCtrl');

goog.require('goog.string');
goog.require('goog.userAgent');
goog.require('ol.events');
goog.require('os.defines');
goog.require('os.map');
goog.require('os.proj');
goog.require('os.proj.switch');
goog.require('os.ui.config.SettingPlugin');



/**
 * @extends {os.ui.config.SettingPlugin}
 * @constructor
 */
os.config.ProjectionSettings = function() {
  os.config.ProjectionSettings.base(this, 'constructor');

  this.setLabel('Projection');
  this.setCategories(['Map']);
  this.setDescription('The base projection for the application');
  this.setTags(['projection', 'epsg', 'mercator', 'geographic']);
  this.setIcon('fa fa-map-o');
  this.setUI('projectionsettings');
};
goog.inherits(os.config.ProjectionSettings, os.ui.config.SettingPlugin);


/**
 * The projection settings UI directive
 * @return {angular.Directive}
 */
os.config.projectionSettingsDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/config/projectionsettings.html',
    controller: os.config.ProjectionSettingsCtrl,
    controllerAs: 'projCtrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('projectionsettings', [os.config.projectionSettingsDirective]);



/**
 * Controller for unit settings
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.config.ProjectionSettingsCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  var map = os.MapContainer.getInstance().getMap();
  ol.events.listen(map, 'change:view', this.onProjectionChange_, this);

  // initialize units from settings
  var projections = os.proj.getProjections(true);
  projections.sort(function(a, b) {
    return goog.string.numerateCompare(
        /** @type {string} */ (a['code']),
        /** @type {string} */ (b['code']));
  });

  this['projections'] = projections;
  this.updateApp();
  this['projection'] = this['appProjection'];

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * @private
 */
os.config.ProjectionSettingsCtrl.prototype.destroy_ = function() {
  var map = os.MapContainer.getInstance().getMap();
  ol.events.unlisten(map, 'change:view', this.onProjectionChange_, this);
  this.scope_ = null;
};


/**
 * @protected
 */
os.config.ProjectionSettingsCtrl.prototype.updateApp = function() {
  var projections = this['projections'];
  var code = os.map.PROJECTION.getCode();

  for (var i = 0, n = projections.length; i < n; i++) {
    if (projections[i]['code'] === code) {
      this['appProjection'] = projections[i];
      this['projection'] = this['appProjection'];
      break;
    }
  }
};


/**
 * @private
 */
os.config.ProjectionSettingsCtrl.prototype.onProjectionChange_ = function() {
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Settings.SWITCH_PROJECTION, 1);
  this.updateApp();
  os.ui.apply(this.scope_);
};


/**
 * Applies the projection change
 * @protected
 */
os.config.ProjectionSettingsCtrl.prototype.apply = function() {
  os.proj.switch.SwitchProjection.getInstance().start(this['projection']['code']);
};
goog.exportProperty(os.config.ProjectionSettingsCtrl.prototype,
    'apply', os.config.ProjectionSettingsCtrl.prototype.apply);
