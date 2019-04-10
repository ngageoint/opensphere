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
    template: '<div class="row"><div class="col text-truncate" ng-bind-html="ctrl.getTitle()"></div>' +
        '<div class="ml-2 float-right" ng-bind-html="ctrl.getViewIcon()"></div></div>',
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
 * Get the title with correct action icon
 * @return {string}
 * @export
 */
os.ui.search.BasicResultCardCtrl.prototype.getViewIcon = function() {
  var file = this.isFileDownloadLink();
  var icon = file ? 'download' : 'external-link';
  var title = file ? 'Download Report' : this['url'];
  var icon = file ? '<i class="fa fa-' + icon + ' px-2" title="' + title + '"></i>' : '';
  var actionIcon = '<a href="' + this['url'] + '" target="' + this['url'] +
      '">' + icon + '</a>';
  return actionIcon;
};


/**
 * To linkify title or not
 * @return {string}
 * @export
 */
os.ui.search.BasicResultCardCtrl.prototype.getTitle = function() {
  var file = this.isFileDownloadLink();
  var linkTitle = '<a href="' + this['url'] + '" target="' + this['url'] + '" title="' +
      this['url'] + '">' + this['title'] + '</a>';
  return file ? this['title'] : linkTitle;
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
