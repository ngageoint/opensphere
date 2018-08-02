goog.provide('os.ui.help.MisconfiguredCtrl');
goog.provide('os.ui.help.misconfiguredDirective');
goog.require('os.config.Settings');
goog.require('os.ui.Module');
goog.require('os.ui.list');


/**
 * The login directive
 * @return {angular.Directive}
 */
os.ui.help.misconfiguredDirective = function() {
  return {
    restrict: 'E',
    // "The system is unable to connect to <name>..."
    scope: {
      'name': '@',
      'reason': '@'
    },
    templateUrl: os.ROOT + 'views/help/misconfigured.html',
    controller: os.ui.help.MisconfiguredCtrl,
    controllerAs: 'misconfigCtrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('misconfigured', [os.ui.help.misconfiguredDirective]);


/**
 * Controller function for the login directive
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.help.MisconfiguredCtrl = function($scope) {
  $scope['name'] = $scope['name'] || 'this feature';
  $scope['ieInstructions'] = os.settings.get(['ieCertIssuesUrl']);
  $scope['caInstructions'] = os.settings.get(['caInstructions']);
  $scope['contactEmail'] = os.settings.get(['supportContact']);
  $scope['contactPhone'] = os.settings.get(['supportPhone']);
};


/**
 * @type {string}
 * @const
 */
os.ui.help.MISCONFIGURED_KEY = 'misconfigured';


os.ui.list.add(os.ui.help.MISCONFIGURED_KEY,
    '<div ng-switch-when="' + os.net.ConnectionConstants.Misconfigure.CA + '">' +
    '<p><strong>Install Certificate Authorities</strong><p>' +
    '<p>As a security measuer, your browser will not allow you to connect to a server it does not recognize. ' +
    'Please follow <a target="_blank" ng-href="{{caInstructions}}">the steps listed here</a> to install the ' +
    'proper certificate authorities to create a trusted connection.</p>' +
    '</div>');

os.ui.list.add(os.ui.help.MISCONFIGURED_KEY,
    '<div ng-switch-when="' + os.net.ConnectionConstants.Misconfigure.IE_SECURITY + '">' +
    '<p><strong>Internet Explorer Security Zones</strong></p>' +
    '<p>Internet Explorer has a security setting which will not allow you to connect to some services. Please ' +
    'adjust your browser\'s settings so those services will be available.</p>' +
    '<p>Please follow <a target="_blank" ng-href="{{ieSecurity}}">the steps listed here</a> to correct the problem.' +
    '</p></div>');
