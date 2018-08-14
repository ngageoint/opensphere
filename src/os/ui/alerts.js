goog.provide('os.ui.alertsDirective');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.alert.AlertViewerCtrl');


/**
 * The alerts directive
 * @return {angular.Directive}
 */
os.ui.alertsDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/windows/alerts.html',
    controller: os.ui.alert.AlertViewerCtrl,
    controllerAs: 'alertViewer'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('alerts', [os.ui.alertsDirective]);
