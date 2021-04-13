goog.module('plugin.xyz.XYZImport');
goog.module.declareLegacyNamespace();

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const SingleUrlProviderImportCtrl = goog.require('os.ui.SingleUrlProviderImportCtrl');
const XYZServer = goog.require('plugin.xyz.XYZServer');
const XYZServerHelpUI = goog.require('plugin.xyz.XYZServerHelpUI');

const osFile = goog.requireType(os.file.File);


/**
 * The XYZ server import directive
 *
 * @return {angular.Directive}
 */
const directive = () => {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: ROOT + 'views/forms/singleurl.html',
    controller: Controller,
    controllerAs: 'ctrl'
  };
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'xyzserver';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for the XYZ server import dialog
 * @unrestricted
 */
class Controller extends SingleUrlProviderImportCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @extends {SingleUrlProviderImportCtrl}
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    /**
     * @type {string}
     */
    this['helpUi'] = XYZServerHelpUI.directiveTag;

    var file = /** @type {osFile} */ ($scope['config']['file']);
    $scope['config']['url'] = file ? file.getUrl() : this.getUrl();
    $scope['typeName'] = 'XYZ Server';
    $scope['urlExample'] = 'https://osm.gs.mil/tiles/default/{z}/{x}/{y}.png'; // TBD
    $scope['config']['type'] = 'xyz';
    $scope['config']['label'] = this.getLabel() || 'XYZ Server';
    $scope['help'] = {}; // TBD: we shouldn't need this, find a more elegant way
    $scope['help']['projection'] = 'This is the content for the projection help popover';
    $scope['help']['minZoom'] = 'This is the content for the minZoom help popover';
    $scope['help']['maxZoom'] = 'This is the content for the maxZoom help popover';
    $scope['help']['zoomOffset'] = 'This is the content for the zoomOffset help popover';
  }

  /**
   * @inheritDoc
   */
  getDataProvider() {
    var dp = new XYZServer();
    dp.configure(this.scope['config']);
    return dp;
  }

  /**
   * @inheritDoc
   */
  getUrl() {
    if (this.dp) {
      var url = /** @type {XYZServer} */ (this.dp).getUrl();
      return url || '';
    }

    return '';
  }

  /**
   * @return {string}
   */
  getLabel() {
    if (this.dp) {
      var label = /** @type {XYZServer} */ (this.dp).getLabel();
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
