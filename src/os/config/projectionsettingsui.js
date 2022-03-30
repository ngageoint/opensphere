goog.declareModuleId('os.config.ProjectionSettingsUI');

import {listen, unlistenByKey} from 'ol/src/events.js';

import * as osMap from '../map/map.js';
import {getMapContainer} from '../map/mapinstance.js';
import Metrics from '../metrics/metrics.js';
import {Settings as SettingsMetrics} from '../metrics/metricskeys.js';
import {ROOT} from '../os.js';
import {getProjections} from '../proj/proj.js';
import SwitchProjection from '../proj/switchprojection.js';
import Module from '../ui/module.js';
import {apply} from '../ui/ui.js';

const {numerateCompare} = goog.require('goog.string');

/**
 * The projection settings UI directive
 *
 * @return {angular.Directive}
 */
export const directive = function() {
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
export const directiveTag = 'projectionsettings';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for unit settings
 * @unrestricted
 */
export class Controller {
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
    this.listenKey_ = listen(map, 'change:view', this.onProjectionChange_, this);

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
    unlistenByKey(this.listenKey_);
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
