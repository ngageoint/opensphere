goog.declareModuleId('plugin.xyz.XYZImport');

import ConfigDescriptor from '../../os/data/configdescriptor.js';
import DataManager from '../../os/data/datamanager.js';
import {createFromOptions} from '../../os/layer/layer.js';
import * as osMap from '../../os/map/map.js';
import {ROOT} from '../../os/os.js';
import {getProjections} from '../../os/proj/proj.js';
import BaseProvider from '../../os/ui/data/baseprovider.js';
import Module from '../../os/ui/module.js';
import SingleUrlProviderImportCtrl from '../../os/ui/singleurlproviderimport.js';
import ConfigProvider from '../config/configprovider.js';
import {directiveTag as uiDirectiveTag} from './xyzdescriptornodeui.js';
import * as XYZProviderHelpUI from './xyzproviderhelp.js';

const {getRandomString, numerateCompare} = goog.require('goog.string');


/**
 * The XYZ provider import directive
 *
 * @return {angular.Directive}
 */
export const directive = () => {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: ROOT + 'views/plugin/xyz/xyzsingleurl.html',
    controller: Controller,
    controllerAs: 'ctrl'
  };
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'xyzprovider';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for the XYZ provider import dialog
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

    /**
     * @type {string}
     */
    this['helpUi'] = XYZProviderHelpUI.directiveTag;

    /**
     * @type {string}
     */
    this.currentId = '';

    // initialize units from settings
    var projections = getProjections(true);
    projections.sort(function(a, b) {
      return numerateCompare(
          /** @type {string} */ (a['code']),
          /** @type {string} */ (b['code']));
    });
    this['projections'] = projections;

    const currentProjection = projections.find((projection) => projection.code == osMap.PROJECTION.getCode());

    $scope['typeName'] = 'XYZ Provider';
    $scope['urlExample'] = 'https://example.com/{z}/{x}/{y}';
    $scope['help'] = {};
    $scope['help']['projection'] = 'The map projection for the layer.';
    $scope['help']['minZoom'] = 'The minimum zoom level supported by the layer.';
    $scope['help']['maxZoom'] = 'The maximum zoom level supported by the layer.';
    $scope['help']['zoomOffset'] = 'The difference in zoom scale between the layer and map. Typically EPSG:3857 ' +
      'layers will have an offset of 0, and EPSG:4326 will have an offset of -1.';
    $scope['help']['tileSize'] = 'The tile size for the layer (always a positive integer).';

    if (!$scope['config']['id']) {
      $scope['config']['label'] = this.getLabel() || '';
      $scope['config']['tileSize'] = 256;
      $scope['config']['title'] = this.scope['config']['label'];
      $scope['config']['type'] = 'XYZ';
      $scope['config']['layerType'] = 'XYZ';
      $scope['config']['url'] = '';
      $scope['config']['projectionObject'] = currentProjection;
      $scope['config']['projection'] = currentProjection.code;
      $scope['config']['minZoom'] = osMap.MIN_ZOOM;
      $scope['config']['maxZoom'] = osMap.MAX_ZOOM;
    } else {
      this.currentId = $scope['config']['id'];
    }

    this.populateZoomOffset(currentProjection.code);
  }

  /**
   * @inheritDoc
   */
  accept() {
    if (!this.scope['form']['$invalid']) {
      this.cleanConfig();
      this.scope['config']['tileSize'] = Math.max(0, Math.round(this.scope['config']['tileSize']));
      this.scope['config']['description'] = 'URL: ' + this.scope['config']['url'] +
      '<br>Projection: ' + this.scope['config']['projection'] +
      '<br>Minimum Zoom: ' + this.scope['config']['minZoom'] +
      '<br>Maximum Zoom: ' + this.scope['config']['maxZoom'] +
      '<br>Zoom Offset: ' + this.scope['config']['zoomOffset'] +
      '<br>Tile Size: ' + this.scope['config']['tileSize'];
      if (this.scope['config']['title'] != this.scope['config']['label']) {
        this.scope['config']['title'] = this.scope['config']['label'];
      }
      if (this.scope['config']['url']) {
        this.scope['config']['urls'] = [this.scope['config']['url']];
      }

      this.dp = this.getDataProvider();
      this.dp.setEditable(true);

      const dm = DataManager.getInstance();
      var descriptor = /** @type {ConfigDescriptor} */ (dm.getDescriptor(this.currentId));
      if (descriptor) {
        this.currentId = '';
        descriptor.setActive(false);
        this.dp.removeDescriptor(descriptor, true);
        dm.removeDescriptor(descriptor);
      } else {
        descriptor = this.createXYZDescriptor(this.scope['config']);
      }

      this.saveXYZDescriptor(descriptor);
      descriptor.setActive(true);

      this.close();
    }
  }

  /**
   * @override
   * @return {ConfigProvider}
   */
  getDataProvider() {
    const dp = ConfigProvider.create('xyz', {'label': 'XYZ Map Layers', 'type': 'xyz', 'listInServers': false});
    return dp;
  }

  /**
   * Create an XYZ descriptor from a layer config.
   * @param {!Object} layerConfig The layer config.
   * @return {!ConfigDescriptor} The descriptor, or null if one could not be created.
   */
  createXYZDescriptor(layerConfig) {
    let descriptor = null;
    descriptor = new ConfigDescriptor();
    descriptor.setBaseConfig(layerConfig);
    createFromOptions(layerConfig);

    return descriptor;
  }

  /**
   * Save an XYZ descriptor to the XYZ provider.
   * @param {ConfigDescriptor} descriptor The descriptor.
   */
  saveXYZDescriptor(descriptor) {
    if (descriptor) {
      const layerConfig = descriptor.getBaseConfig();

      if (this.dp) {
        const configProvider = /** @type {ConfigProvider} */ (this.dp);
        configProvider.setEditable(true);

        const id = `${getRandomString()}`;

        // Set config descriptor options.
        layerConfig['nodeUi'] = `<${uiDirectiveTag}></${uiDirectiveTag}>`;
        layerConfig['id'] = `xyz${BaseProvider.ID_DELIMITER}${id}`;

        // Prevent the data manager from automatically expiring the descriptor.
        descriptor.setLocal(true);

        configProvider.addLayerGroup(id, layerConfig);
      }
    }
  }

  /**
   * @return {string}
   */
  getLabel() {
    if (this.dp) {
      const configProvider = /** @type {ConfigProvider} */ (this.dp);
      const label = configProvider.getLabel();
      return label || '';
    }

    return '';
  }

  /**
   * Populate zoom offset based on current state
   * @param {string} projection
   * @export
   */
  populateZoomOffset(projection) {
    this.scope['config']['zoomOffset'] = null;
    switch (projection) {
      case 'EPSG:4326':
        this.scope['config']['zoomOffset'] = -1;
        break;
      case 'EPSG:3857':
      default:
        this.scope['config']['zoomOffset'] = 0;
        break;
    }
  }

  /**
   * Handle projection change
   * @export
   */
  onProjectionChange() {
    this.scope['config']['projection'] = this.scope['config']['projectionObject'].code;
    this.populateZoomOffset(this.scope['config']['projection']);
  }
}
