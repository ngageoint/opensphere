goog.declareModuleId('os.ui.state.StateExportUI');

import {ROOT} from '../../os.js';
import ExportManager from '../file/exportmanager.js';
import Module from '../module.js';
import WindowEventType from '../windoweventtype.js';
import AbstractStateFormCtrl from './abstractstateform.js';
const config = goog.require('os.config');
const {getStateManager} = goog.require('os.state.instance');

const IState = goog.requireType('os.state.IState');


/**
 * The stateexport window directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/window/stateimportexport.html',
  controller: Controller,
  controllerAs: 'stateForm'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'stateexport';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the save export window
 * @unrestricted
 */
export class Controller extends AbstractStateFormCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element);

    /**
     * @type {string|undefined}
     */
    this['appName'] = config.getAppName();

    /**
     * @type {?string}
     */
    this['persister'] = null;

    var persisters = ExportManager.getInstance().getPersistenceMethods();
    if (persisters && persisters.length > 0) {
      for (var i = 0, n = persisters.length; i < n; i++) {
        this['persisters'][persisters[i].getLabel()] = persisters[i];
      }
    }

    var defaultMethod = /** @type {string|undefined} */ ($scope['method']) || 'File';
    if (defaultMethod && defaultMethod in this['persisters']) {
      this['persister'] = this['persisters'][defaultMethod];
    }

    /**
     * @type {Array<IState>}
     */
    this['states'] = getStateManager().getAvailable();

    /**
     * @type {boolean}
     */
    this['all'] = this['states'].every(function(state) {
      return state.getSupported() ? state.getEnabled() : true;
    }, this);

    /**
     * @type {boolean}
     */
    this['isSaving'] = true;
    $timeout(() => $scope.$emit(WindowEventType.READY));
  }

  /**
   * @inheritDoc
   * @export
   */
  accept() {
    var method = this['persister'] || null;
    var title = /** @type {string} */ (this.scope['title']);
    var description = /** @type {string|undefined} */ (this.scope['description']);
    var tags = /** @type {string|undefined} */ (this.scope['tags']);
    var states;

    if (this['states'] && this['states'].length > 0) {
      states = [];

      for (var i = 0, n = this['states'].length; i < n; i++) {
        var state = this['states'][i];
        if (state.getEnabled()) {
          states.push(state);
        }
      }
    }
    getStateManager().saveStates(method, title, description, tags, states);

    super.accept();
  }
}
