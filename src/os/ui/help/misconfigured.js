goog.declareModuleId('os.ui.help.MisconfiguredUI');

import Settings from '../../config/settings.js';
import * as ConnectionConstants from '../../net/connectionconstants.js';
import {ROOT} from '../../os.js';
import {add} from '../list.js';
import Module from '../module.js';


/**
 * The login directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  // "The system is unable to connect to <name>..."
  scope: {
    'name': '@',
    'reason': '@'
  },
  templateUrl: ROOT + 'views/help/misconfigured.html',
  controller: Controller,
  controllerAs: 'misconfigCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'misconfigured';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the login directive
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    $scope['name'] = $scope['name'] || 'this feature';
    $scope['ieInstructions'] = Settings.getInstance().get(['ieCertIssuesUrl']);
    $scope['caInstructions'] = Settings.getInstance().get(['caInstructions']);
    $scope['contactEmail'] = Settings.getInstance().get(['supportContact']);
    $scope['contactPhone'] = Settings.getInstance().get(['supportPhone']);
  }
}

/**
 * @type {string}
 */
const MISCONFIGURED_KEY = 'misconfigured';

add(MISCONFIGURED_KEY,
    '<div ng-switch-when="' + ConnectionConstants.Misconfigure.CA + '">' +
    '<p><strong>Install Certificate Authorities</strong><p>' +
    '<p>As a security measuer, your browser will not allow you to connect to a server it does not recognize. ' +
    'Please follow <a target="_blank" ng-href="{{caInstructions}}">the steps listed here</a> to install the ' +
    'proper certificate authorities to create a trusted connection.</p>' +
    '</div>');

add(MISCONFIGURED_KEY,
    '<div ng-switch-when="' + ConnectionConstants.Misconfigure.IE_SECURITY + '">' +
    '<p><strong>Internet Explorer Security Zones</strong></p>' +
    '<p>Internet Explorer has a security setting which will not allow you to connect to some services. Please ' +
    'adjust your browser\'s settings so those services will be available.</p>' +
    '<p>Please follow <a target="_blank" ng-href="{{ieSecurity}}">the steps listed here</a> to correct the problem.' +
    '</p></div>');
