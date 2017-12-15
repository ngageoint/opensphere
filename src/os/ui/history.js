goog.provide('os.ui.historyDirective');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.history.HistoryViewCtrl');


/**
 * The history directive
 * @return {angular.Directive}
 */
os.ui.historyDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/windows/history.html',
    controller: os.ui.history.HistoryViewCtrl,
    controllerAs: 'historyView'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('history', [os.ui.historyDirective]);
