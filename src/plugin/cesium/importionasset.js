goog.declareModuleId('plugin.cesium.ImportIonAssetUI');

import DataManager from '../../os/data/datamanager.js';
import {ROOT} from '../../os/os.js';
import Module from '../../os/ui/module.js';
import * as osWindow from '../../os/ui/window.js';
import WindowEventType from '../../os/ui/windoweventtype.js';
import TilesDescriptor from './tiles/cesium3dtilesdescriptor.js';
import TilesProvider from './tiles/cesium3dtilesprovider.js';


/**
 * All purpose file/url import directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/plugin/cesium/importionasset.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'importionasset';


/**
 * Add the directive to the ui module
 */
Module.directive(directiveTag, [directive]);



/**
 * Controller for the Ion asset import dialog.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    /**
     * @type {number}
     */
    this['assetId'] = 0;

    /**
     * @type {string}
     */
    this['accessToken'] = '';

    /**
     * @type {string}
     */
    this['title'] = 'New Ion Asset';

    /**
     * @type {string}
     */
    this['description'] = '';

    /**
     * @type {string}
     */
    this['tags'] = '';

    $scope.$emit(WindowEventType.READY);
  }

  /**
   * Angular $onDestroy lifecycle hook.
   */
  $onDestroy() {
    this.element_ = null;
  }

  /**
   * Import the asset and close the window.
   *
   * @export
   */
  accept() {
    const descriptor = TilesDescriptor.create({
      'accessToken': this['accessToken'],
      'assetId': this['assetId'],
      'title': this['title'],
      'description': this['description'],
      'tags': this['tags']
    });
    DataManager.getInstance().addDescriptor(descriptor);

    const provider = TilesProvider.getInstance();
    provider.addDescriptor(descriptor);

    this.close();
  }

  /**
   * Close the window.
   *
   * @export
   */
  close() {
    osWindow.close(this.element_);
  }
}
