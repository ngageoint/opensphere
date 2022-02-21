goog.declareModuleId('plugin.ogc.ui.GeoserverImportUI');

import '../../../os/ui/singleurlform.js';
import * as os from '../../../os/os.js';
import Module from '../../../os/ui/module.js';
import SingleUrlProviderImportCtrl from '../../../os/ui/singleurlproviderimport.js';
import GeoServer from '../geoserver.js';
import * as GeoServerHelpUI from './geoserverhelp.js';

/**
 * The geoserver import directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
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
export const directiveTag = 'geoserver';


/**
 * Add the directive to the module
 */
Module.directive('geoserver', [directive]);


/**
 * Controller for the geoserver import dialog
 * @unrestricted
 */
export class Controller extends SingleUrlProviderImportCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
    this['helpUi'] = GeoServerHelpUI.directiveTag;

    var file = /** @type {OSFile} */ ($scope['config']['file']);
    // regex handles URLs of the sort /geoserver(/stuff)/ows(/otherstuff), where it keeps (/stuff) intact, but removes
    // (/otherstuff) at the end of the URL
    $scope['config']['url'] = file ? file.getUrl().replace(/(\/geoserver|\/.*?gs)(\/.*)(web|ows)[#?\/].*$/, '/geoserver$1ows') :
      this.getUrl();
    $scope['config']['type'] = 'geoserver';
    $scope['typeName'] = 'GeoServer';
    $scope['urlExample'] = 'http://www.example.com/geoserver/ows';

    this.validateUrl();
  }

  /**
   * @inheritDoc
   */
  getDataProvider() {
    var dp = new GeoServer();
    dp.configure(this.scope['config']);
    return dp;
  }

  /**
   * @inheritDoc
   */
  getUrl() {
    return this.dp ? /** @type {GeoServer} */ (this.dp).getOriginalWmsUrl() : '';
  }

  /**
   * @inheritDoc
   * @export
   */
  validateUrl() {
    if (/\/web\/?$/.test(this.scope['config']['url'])) {
      this.scope['customUrlMessage'] = 'GeoServer URLs ending with \"/web\" are typically for the administration ' +
      'interface. Consider replacing \"/web\" with \"/ows\" for the OGC service APIs.';
    } else {
      this.scope['customUrlMessage'] = undefined;
    }
  }
}
