goog.declareModuleId('os.config.InterpolationSettingsUI');

import InterpolateFeatures from '../command/interpolatefeaturescmd.js';
import {SettingsKey, getConfig, setConfig} from '../interpolate.js';
import {ROOT} from '../os.js';
import Module from '../ui/module.js';
import {getSettings} from './configinstance.js';

const Delay = goog.require('goog.async.Delay');
const GoogEventType = goog.require('goog.events.EventType');

const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');


/**
 * The interpolation settings UI directive
 *
 * @return {angular.Directive}
 */
export const directive = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: ROOT + 'views/config/interpolationsettings.html',
    controller: Controller,
    controllerAs: 'intCtrl'
  };
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'interpolationsettings';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for interpolation settings
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

    /**
     * @type {Delay}
     * @private
     */
    this.delay_ = new Delay(this.apply, 400, this);

    getSettings().listen(GoogEventType.PROPERTYCHANGE, this.onSettingsChanged, false, this);
    $scope.$on('$destroy', this.destroy_.bind(this));

    var watcher = this.delay_.start.bind(this.delay_);

    $scope.$watch('method', watcher);
    $scope.$watch('kilometers', watcher);

    this.update();
  }

  /**
   * @private
   */
  destroy_() {
    getSettings().unlisten(GoogEventType.PROPERTYCHANGE, this.onSettingsChanged, false, this);
    this.delay_.dispose();
    this.scope_ = null;
  }

  /**
   * @param {PropertyChangeEvent} evt The settings change event
   * @protected
   */
  onSettingsChanged(evt) {
    if (/^interpolation\.?/.test(evt.getProperty())) {
      this.update();
    }
  }

  /**
   * Updates the scope from the interpolation package
   *
   * @protected
   */
  update() {
    var conf = getConfig();

    this.scope_['kilometers'] = /** @type {number} */ (conf['distance']) / 1000;
    this.scope_['method'] = conf['method'];
  }

  /**
   * Applies the selected settings
   *
   * @protected
   */
  apply() {
    var method = this.scope_['method'];
    var kilometers = this.scope_['kilometers'];

    if (method && kilometers) {
      var conf = {
        'method': method,
        'distance': kilometers * 1000
      };

      var differs = false;
      var curr = getConfig();

      for (var key in curr) {
        if (key in conf && conf[key] !== curr[key]) {
          differs = true;
          break;
        }
      }

      if (differs) {
        setConfig(/** @type {Object<string, *>} */ (conf));
        getSettings().set(SettingsKey.INTERPOLATION, conf);

        var cmd = new InterpolateFeatures();
        cmd.execute();
      }
    }
  }
}
