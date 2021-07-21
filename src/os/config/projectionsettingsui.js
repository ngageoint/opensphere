goog.module('os.config.ProjectionSettingsUI');
goog.module.declareLegacyNamespace();

const {numerateCompare} = goog.require('goog.string');
const {listen, unlisten} = goog.require('ol.events');
const {ROOT} = goog.require('os');
const osMap = goog.require('os.map');
const {getMapContainer} = goog.require('os.map.instance');
const Metrics = goog.require('os.metrics.Metrics');
const {Settings: SettingsMetrics} = goog.require('os.metrics.keys');
const {getProjections} = goog.require('os.proj');
const SwitchProjection = goog.require('os.proj.switch.SwitchProjection');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');


/**
 * The projection settings UI directive
 *
 * @return {angular.Directive}
 */
const directive = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: ROOT + 'views/config/projectionsettings.html',
    controller: Controller,
    controllerAs: 'projCtrl'
  };
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'projectionsettings';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for unit settings
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

    var map = getMapContainer().getMap();
    listen(map, 'change:view', this.onProjectionChange_, this);

    // initialize units from settings
    var projections = getProjections(true);
    projections.sort((a, b) => numerateCompare(/** @type {string} */ (a['code']), /** @type {string} */ (b['code'])));

    this['projections'] = projections;
    this.updateApp();
    this['projection'] = this['appProjection'];

    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * @private
   */
  destroy_() {
    var map = getMapContainer().getMap();
    unlisten(map, 'change:view', this.onProjectionChange_, this);
    this.scope_ = null;
  }

  /**
   * @protected
   */
  updateApp() {
    var projections = this['projections'];
    var code = osMap.PROJECTION.getCode();

    for (var i = 0, n = projections.length; i < n; i++) {
      if (projections[i]['code'] === code) {
        this['appProjection'] = projections[i];
        this['projection'] = this['appProjection'];
        break;
      }
    }
  }

  /**
   * @private
   */
  onProjectionChange_() {
    Metrics.getInstance().updateMetric(SettingsMetrics.SWITCH_PROJECTION, 1);
    this.updateApp();
    apply(this.scope_);
  }

  /**
   * Applies the projection change
   *
   * @export
   */
  apply() {
    SwitchProjection.getInstance().start(this['projection']['code']);
  }
}

exports = {
  directive,
  directiveTag,
  Controller
};
