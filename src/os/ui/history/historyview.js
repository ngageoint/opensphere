goog.provide('os.ui.history.historyViewDirective');
goog.require('os.ui.Module');
goog.require('os.ui.history.HistoryViewCtrl');


/**
 * The history-view directive
 * @return {angular.Directive}
 */
os.ui.history.historyViewDirective = function() {
  return {
    restrict: 'AE',
    scope: true,
    templateUrl: os.ROOT + 'views/historyview/historyview.html',
    controller: os.ui.history.HistoryViewCtrl,
    controllerAs: 'historyViewCtrl'
  };
};


/**
 * Register history-view directive.
 */
os.ui.Module.directive('historyView', [os.ui.history.historyViewDirective]);
