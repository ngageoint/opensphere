goog.provide('os.config.InterpolationSettings');
goog.provide('os.config.InterpolationSettingsCtrl');

goog.require('goog.async.Delay');
goog.require('os.command.InterpolateFeatures');
goog.require('os.interpolate');
goog.require('os.map');
goog.require('os.ui.config.SettingPlugin');



/**
 * @extends {os.ui.config.SettingPlugin}
 * @constructor
 */
os.config.InterpolationSettings = function() {
  os.config.InterpolationSettings.base(this, 'constructor');

  this.setLabel('Interpolation');
  this.setCategories(['Map']);
  this.setDescription('Interpolation settings for line/polygon segments');
  this.setTags(['interpolation', 'line', 'polygon', 'render']);
  this.setIcon('fa fa-ellipsis-h');
  this.setUI('interpolationsettings');
};
goog.inherits(os.config.InterpolationSettings, os.ui.config.SettingPlugin);


/**
 * The interpolation settings UI directive
 * @return {angular.Directive}
 */
os.config.interpolationSettingsDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/config/interpolationsettings.html',
    controller: os.config.InterpolationSettingsCtrl,
    controllerAs: 'intCtrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('interpolationsettings', [os.config.interpolationSettingsDirective]);



/**
 * Controller for interpolation settings
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.config.InterpolationSettingsCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.delay_ = new goog.async.Delay(this.apply, 400, this);

  os.settings.listen(goog.events.EventType.PROPERTYCHANGE, this.onSettingsChanged, false, this);
  $scope.$on('$destroy', this.destroy_.bind(this));

  var watcher = this.delay_.start.bind(this.delay_);

  $scope.$watch('method', watcher);
  $scope.$watch('kilometers', watcher);

  this.update();
};


/**
 * @private
 */
os.config.InterpolationSettingsCtrl.prototype.destroy_ = function() {
  os.settings.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onSettingsChanged, false, this);
  this.delay_.dispose();
  this.scope_ = null;
};


/**
 * @param {os.events.PropertyChangeEvent} evt The settings change event
 * @protected
 */
os.config.InterpolationSettingsCtrl.prototype.onSettingsChanged = function(evt) {
  if (/^interpolation\.?/.test(evt.getProperty())) {
    this.update();
  }
};


/**
 * Updates the scope from the interpolation package
 * @protected
 */
os.config.InterpolationSettingsCtrl.prototype.update = function() {
  var conf = os.interpolate.getConfig();

  this.scope_['kilometers'] = /** @type {number} */ (conf['distance']) / 1000;
  this.scope_['method'] = conf['method'];
};


/**
 * Applies the selected settings
 * @protected
 */
os.config.InterpolationSettingsCtrl.prototype.apply = function() {
  var method = this.scope_['method'];
  var kilometers = this.scope_['kilometers'];

  if (method && kilometers) {
    var conf = {
      'method': method,
      'distance': kilometers * 1000
    };

    var differs = false;
    var curr = os.interpolate.getConfig();

    for (var key in curr) {
      if (key in conf && conf[key] !== curr[key]) {
        differs = true;
        break;
      }
    }

    if (differs) {
      os.interpolate.setConfig(/** @type {Object<string, *>} */ (conf));
      os.settings.set(os.interpolate.SettingsKey.INTERPOLATION, conf);

      var cmd = new os.command.InterpolateFeatures();
      cmd.execute();
    }
  }
};
