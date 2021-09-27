goog.declareModuleId('os.ui.file.AddServer');

import {ROOT} from '../../os.js';
import ImportManager from '../im/importmanager.js';
import Module from '../module.js';
import * as osWindow from '../window.js';
import WindowEventType from '../windoweventtype.js';


/**
 * The addserver directive.
 * @return {angular.Directive}
 */
export const directive = () => {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: ROOT + 'views/file/addserver.html',
    controller: Controller,
    controllerAs: 'ctrl'
  };
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'addserver';


/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for the addserver directive.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    /**
     * @type {boolean}
     */
    this['loading'] = false;

    /**
     * @type {string}
     */
    this['serverType'] = '';

    /**
     * Available server type choices in the UI.
     * @type {Array}
     */
    this['items'] = Object.values(ImportManager.getInstance().getServerTypes() || []);

    $scope.$emit(WindowEventType.READY);
    $scope.$on('testing', this.onTesting_.bind(this));
  }

  /**
   * Clean up references/listeners.
   */
  $onDestroy() {
    this.scope_ = null;
    this.element_ = null;
  }

  /**
   * Get the appropriate UI for the serverType.
   * @param {?string} item
   * @return {?string} UI
   * @export
   */
  getUi(item) {
    if (item) {
      return ImportManager.getInstance().getServerType(item.type).formUi;
    }

    return null;
  }

  /**
   * Update the uiswitch scope.
   * @param {angular.Scope} scope The scope.
   * @export
   */
  updateUiScope(scope) {
    const config = {'enabled': true};
    scope.config = config;
  }

  /**
   * Save button handler
   * @export
   */
  accept() {
    this.scope_.$broadcast('accept');
  }

  /**
   * Close the window.
   * @export
   */
  close() {
    if (this.element_) {
      osWindow.close(this.element_);
    }
  }

  /**
   * Testing status change handler
   * @param {angular.Scope.Event} event
   * @param {boolean} value
   * @export
   */
  onTesting_(event, value) {
    this['loading'] = !!value;
  }
}

/**
 * Launch a window that will add servers
 */
export const launchAddServerWindow = function() {
  const id = 'addServer';
  if (osWindow.exists(id)) {
    osWindow.bringToFront(id);
  } else {
    osWindow.create({
      'id': id,
      'label': 'Add Server',
      'icon': 'fa fa-database',
      'x': 'center',
      'y': 'center',
      'width': '500',
      'min-width': '500',
      'max-width': '500',
      'height': '500',
      'modal': true,
      'show-close': true
    }, 'addserver');
  }
};
