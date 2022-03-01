goog.declareModuleId('plugin.tileserver.TileserverImportUI');

import {ROOT} from 'opensphere/src/os/os.js';
import Module from 'opensphere/src/os/ui/module.js';
import SingleUrlProviderImportCtrl from 'opensphere/src/os/ui/singleurlproviderimport.js';

import Tileserver from './tileserver.js';
import {ID} from './index.js';


/**
 * The Tileserver import directive
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/forms/singleurl.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'tileserver';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the Tileserver server import dialog
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

    const file = /** @type {os.file.File} */ ($scope['config']['file']);
    $scope['config']['url'] = file ? file.getUrl() : this.getUrl();
    $scope['urlExample'] = 'https://www.example.com/somepath/index.json';
    $scope['config']['type'] = ID;
    $scope['config']['label'] = this.getLabel() || 'Tileserver';
  }

  /**
   * @inheritDoc
   */
  getDataProvider() {
    const dp = new Tileserver();
    dp.configure(this.scope['config']);
    return dp;
  }

  /**
   * @inheritDoc
   */
  getUrl() {
    if (this.dp) {
      const url = /** @type {Tileserver} */ (this.dp).getUrl();
      return url || '';
    }

    return '';
  }

  /**
   * @return {string}
   */
  getLabel() {
    if (this.dp) {
      const label = /** @type {Tileserver} */ (this.dp).getLabel();
      return label || '';
    }

    return '';
  }
}
