goog.declareModuleId('os.ui.search.BasicResultCardUI');

import Module from '../module.js';
import * as TuiEditor from '../text/tuieditor.js';

const Settings = goog.require('os.config.Settings');


/**
 * The resultcard directive for displaying search results.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  template: '<div class="row"><div class="col text-truncate" ng-bind-html="ctrl.getTitle()"></div>' +
      '<div class="ml-2 float-right" ng-bind-html="ctrl.getViewIcon()"></div></div>',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'basicresultcard';

/**
 * Register the resultcard directive.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the resultcard directive.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$compile} $compile
   * @ngInject
   */
  constructor($scope, $element, $compile) {
    if ('result' in $scope) {
      var result = $scope['result'].getResult();
      this['url'] = result.getUrl();
      this['title'] = TuiEditor.getUnformatedText(result.getTitle());
    }
  }

  /**
   * Get the title with correct action icon
   *
   * @return {string}
   * @export
   */
  getViewIcon() {
    var file = this.isFileDownloadLink();
    var icon = file ? '<i class="fa fa-download px-2" title="Download Report"></i>' : '';
    var actionIcon = '<a href="' + this['url'] + '" target="' + this['url'] +
        '">' + icon + '</a>';
    return actionIcon;
  }

  /**
   * To linkify title or not
   *
   * @return {string}
   * @export
   */
  getTitle() {
    var file = this.isFileDownloadLink();
    var linkTitle = '<a href="' + this['url'] + '" target="' + this['url'] + '" title="' +
        this['url'] + '">' + this['title'] + '</a>';
    return file ? this['title'] : linkTitle;
  }

  /**
   * Is the link to an external site
   *
   * @return {boolean}
   * @export
   */
  isFileDownloadLink() {
    var fileDownloadUrl = /** @type {string} */ (Settings.getInstance().get('tools.fileDownloadUrl'));
    return !!this['url'] && this['url'].includes(fileDownloadUrl);
  }
}
