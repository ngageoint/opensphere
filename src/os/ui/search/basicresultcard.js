goog.provide('os.ui.search.BasicResultCardCtrl');
goog.provide('os.ui.search.basicResultCardDirective');

goog.require('os.ui.Module');
goog.require('os.ui.text.SimpleMDE');


/**
 * The resultcard directive for displaying search results.
 * @return {angular.Directive}
 */
os.ui.search.basicResultCardDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    template: '<div class="row"><div class="col text-truncate">{{ctrl.title}}</div>' +
        '<div class="ml-2 float-right"ng-bind-html="ctrl.getViewLink()"></div></div>',
    controller: os.ui.search.BasicResultCardCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Register the resultcard directive.
 */
os.ui.Module.directive('basicresultcard', [os.ui.search.basicResultCardDirective]);



/**
 * Controller for the resultcard directive.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$compile} $compile
 * @constructor
 * @ngInject
 */
os.ui.search.BasicResultCardCtrl = function($scope, $element, $compile) {
  if ('result' in $scope) {
    var result = $scope['result'].getResult();
    this['url'] = result.getUrl();
    this['title'] = os.ui.text.SimpleMDE.getUnformatedText(result.getTitle());
  }
};


/**
 * Get the title with correct action button
 * @return {string}
 * @export
 */
os.ui.search.BasicResultCardCtrl.prototype.getViewLink = function() {
  var file = this.isFileDownloadLink();
  var icon = file ? 'download' : 'external-link';
  var title = file ? 'Download Report' : 'Visit External Report Link';
  var actionBtn = '<a href="' + this['url'] + '" target="' + this['url'] +
      '"><i class="fa fa-' + icon + ' px-2" title="' + title + '"></i></a>';
  return actionBtn;
};


/**
 * Is the link to an external site
 * @return {boolean}
 * @export
 */
os.ui.search.BasicResultCardCtrl.prototype.isFileDownloadLink = function() {
  var fileDownloadUrl = /** @type {string} */ (os.settings.get('tools.fileDownloadUrl'));
  return goog.string.contains(this['url'], fileDownloadUrl);
};
