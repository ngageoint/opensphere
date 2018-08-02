goog.provide('os.ui.capture.captureButtonDirective');
goog.require('os.metrics.Metrics');
goog.require('os.ui.Module');


/**
 * HTML template for the capture button.
 * @type {string}
 * @const
 */
os.ui.capture.CAPTURE_BTN_TEMPLATE = '<button class="btn btn-default capture" ng-click="capture()" ' +
    'title="Take a screenshot of the {{appText || \'canvas\'}}"><i class="fa fa fa-camera"></i></button>';


/**
 * The capturebutton directive
 * @return {angular.Directive}
 */
os.ui.capture.captureButtonDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'appText': '@'
    },
    template: os.ui.capture.CAPTURE_BTN_TEMPLATE,
    link: os.ui.capture.captureButtonLink_
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('capturebutton', [os.ui.capture.captureButtonDirective]);


/**
 * Capture screenshot button link function.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @private
 */
os.ui.capture.captureButtonLink_ = function($scope, $element) {
  $scope['capture'] = os.ui.capture.fireCaptureEvent_;
};


/**
 * Fires an event to initiate screen capture.
 * @private
 */
os.ui.capture.fireCaptureEvent_ = function() {
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.SCREEN_CAPTURE, 1);
  os.dispatcher.dispatchEvent(os.time.TimelineEventType.CAPTURE);
};
