goog.module('plugin.arc.ArcImportUI');

goog.require('os.ui.singleUrlFormDirective');

const os = goog.require('os');
const Module = goog.require('os.ui.Module');
const SingleUrlProviderImportCtrl = goog.require('os.ui.SingleUrlProviderImportCtrl');
const ArcServer = goog.require('plugin.arc.ArcServer');
const ArcServerHelpUI = goog.require('plugin.arc.ArcServerHelpUI');

const OSFile = goog.requireType('os.file.File');


/**
 * The Arc server import directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: os.ROOT + 'views/forms/singleurl.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'arcserver';


/**
 * Add the directive to the module
 */
Module.directive('arcserver', [directive]);



/**
 * Controller for the Arc server import dialog
 * @unrestricted
 */
class Controller extends SingleUrlProviderImportCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
    this['helpUi'] = ArcServerHelpUI.directiveTag;

    var file = /** @type {OSFile} */ ($scope['config']['file']);
    $scope['config']['url'] = file ? file.getUrl() : this.getUrl();
    $scope['typeName'] = 'ArcGIS Server';
    $scope['urlExample'] = 'https://www.example.com/arcgis/rest/services';
    $scope['config']['type'] = 'arc';
    $scope['config']['label'] = this.getLabel() || 'ArcGIS Server';
  }

  /**
   * @inheritDoc
   */
  getDataProvider() {
    var dp = new ArcServer();
    dp.configure(this.scope['config']);
    return dp;
  }

  /**
   * @inheritDoc
   */
  getUrl() {
    if (this.dp) {
      var url = /** @type {ArcServer} */ (this.dp).getUrl();
      return url || '';
    }

    return '';
  }

  /**
   * @return {string}
   */
  getLabel() {
    if (this.dp) {
      var label = /** @type {ArcServer} */ (this.dp).getLabel();
      return label || '';
    }

    return '';
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
