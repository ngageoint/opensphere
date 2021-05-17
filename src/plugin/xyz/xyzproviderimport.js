goog.module('plugin.xyz.XYZImport');
goog.module.declareLegacyNamespace();

const {getRandomString, numerateCompare} = goog.require('goog.string');
const ConfigProvider = goog.require('plugin.config.Provider');
const {ROOT} = goog.require('os');
const ConfigDescriptor = goog.require('os.data.ConfigDescriptor');
const {createFromOptions} = goog.require('os.layer');
const {getProjections} = goog.require('os.proj');
const Module = goog.require('os.ui.Module');
const {ID_DELIMITER} = goog.require('os.ui.data.BaseProvider');
const SingleUrlProviderImportCtrl = goog.require('os.ui.SingleUrlProviderImportCtrl');
const XYZProviderHelpUI = goog.require('plugin.xyz.XYZProviderHelpUI');

const IDataDescriptor = goog.requireType('os.data.IDataDescriptor');


/**
 * The XYZ provider import directive
 *
 * @return {angular.Directive}
 */
const directive = () => {
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
const directiveTag = 'xyzprovider';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for the XYZ provider import dialog
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

    /**
     * @type {string}
     */
    this['helpUi'] = XYZProviderHelpUI.directiveTag;

    // initialize units from settings
    var projections = getProjections(true);
    projections.sort(function(a, b) {
      return numerateCompare(
          /** @type {string} */ (a['code']),
          /** @type {string} */ (b['code']));
    });

    this['projections'] = projections;

    $scope['typeName'] = 'XYZ Provider';
    $scope['urlExample'] = 'https://example.com/{z}/{x}/{y}';
    $scope['config']['id'] = 'xyz';
    $scope['config']['label'] = this.getLabel() || '';
    $scope['config']['title'] = this.scope['config']['label'];
    $scope['config']['type'] = 'XYZ';
    $scope['config']['layerType'] = 'XYZ';
    $scope['config']['url'] = '';
    $scope['config']['minZoom'] = 1;
    $scope['config']['maxZoom'] = 25;
    $scope['help'] = {};
    $scope['help']['projection'] = 'The map projection for the layer.';
    $scope['help']['minZoom'] = 'The minimum zoom level supported by the layer.';
    $scope['help']['maxZoom'] = 'The maximum zoom level supported by the layer.';
    $scope['help']['zoomOffset'] = 'The difference in zoom scale between the layer and map. Typically EPSG:3857 ' +
      'layers will have an offset of 0, and EPSG:4326 will have an offset of -1.';
  }

  /**
   * @inheritDoc
   */
  accept() {
    if (!this.scope['form']['$invalid']) {
      this.cleanConfig();

      this.dp = this.getDataProvider();
      this.dp.setEditable(true);

      this.scope['config']['description'] = 'URL: ' + this.scope['config']['url'] +
        '<br>Projection: ' + this.scope['config']['projection']['code'] +
        '<br>Minimum Zoom: ' + this.scope['config']['minZoom'] +
        '<br>Maximum Zoom: ' + this.scope['config']['maxZoom'] +
        '<br>Zoom Offset: ' + this.scope['config']['zoomOffset'];
      this.createXYZDescriptor(this.scope['config']);
      this.close();
    }
  }

  /**
   * @inheritDoc
   */
  getDataProvider() {
    const dp = ConfigProvider.create('xyz', {'label': 'XYZ Layers', 'listInServers': false});
    return dp;
  }

  /**
   * Create an XYZ descriptor from a layer config.
   * @param {!Object} layerConfig The layer config.
   * @return {IDataDescriptor} The descriptor, or null if one could not be created.
   */
  createXYZDescriptor(layerConfig) {
    const projectionObject = layerConfig['projectionObject'] ? layerConfig['projectionObject'] :
      layerConfig['projection'];
    if (projectionObject) {
      const projectionCode = projectionObject['code'];
      layerConfig['projectionObject'] = projectionObject;
      layerConfig['projection'] = projectionCode;
      layerConfig['title'] = layerConfig['label'];
    }

    let descriptor = null;
    descriptor = new ConfigDescriptor();
    descriptor.setBaseConfig(layerConfig);
    createFromOptions(layerConfig);

    this.saveXYZDescriptor(descriptor);

    return descriptor;
  }

  /**
   * Save an XYZ descriptor to the XYZ provider.
   * @param {!IDataDescriptor} descriptor The descriptor.
   */
  saveXYZDescriptor(descriptor) {
    if (descriptor) {
      const layerConfig = descriptor.getBaseConfig();

      if (this.dp) {
        this.dp.setEditable(true);

        // Set config descriptor options.
        const id = `${getRandomString()}`;
        layerConfig['nodeUi'] = '<descriptornodeui></descriptornodeui>';
        layerConfig['provider'] = this.dp.getLabel();
        layerConfig['id'] = `xyz${ID_DELIMITER}${id}`;

        // Prevent the data manager from automatically expiring the descriptor.
        descriptor.setLocal(true);

        this.dp.addLayerGroup(id, layerConfig);
      }
    }
  }

  /**
   * @return {string}
   */
  getLabel() {
    if (this.dp) {
      var label = /** @type {ConfigProvider} */ (this.dp).getLabel();
      return label || '';
    }

    return '';
  }

  /**
   * Handle projection change
   * @export
   */
  onProjectionChange() {
    this.scope['config']['zoomOffset'] = null;
    switch (this.scope['config']['projection'].code) {
      case 'EPSG:4326':
        this.scope['config']['zoomOffset'] = -1;
        break;
      case 'EPSG:3857':
      default:
        this.scope['config']['zoomOffset'] = 0;
        break;
    }
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
