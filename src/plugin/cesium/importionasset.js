goog.provide('plugin.cesium.ImportIonAssetCtrl');
goog.provide('plugin.cesium.importIonAssetDirective');

goog.require('goog.Disposable');
goog.require('os.ui');
goog.require('os.ui.Module');
goog.require('os.ui.window');


/**
 * All purpose file/url import directive
 * @return {angular.Directive}
 */
plugin.cesium.importIonAssetDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/plugin/cesium/importionasset.html',
    controller: plugin.cesium.ImportIonAssetCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('importionasset', [plugin.cesium.importIonAssetDirective]);



/**
 * Controller for the Ion asset import dialog.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
plugin.cesium.ImportIonAssetCtrl = function($scope, $element) {
  plugin.cesium.ImportIonAssetCtrl.base(this, 'constructor');

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

  $scope.$emit(os.ui.WindowEventType.READY);
  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(plugin.cesium.ImportIonAssetCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
plugin.cesium.ImportIonAssetCtrl.prototype.disposeInternal = function() {
  plugin.cesium.ImportIonAssetCtrl.base(this, 'disposeInternal');

  this.element_ = null;
};


/**
 * Import the asset and close the window.
 * @export
 */
plugin.cesium.ImportIonAssetCtrl.prototype.accept = function() {
  var descriptor = plugin.cesium.tiles.Descriptor.createFromConfig({
    'accessToken': this['accessToken'],
    'assetId': this['assetId'],
    'title': this['title'],
    'description': this['description'],
    'tags': this['tags']
  });
  os.dataManager.addDescriptor(descriptor);

  var provider = plugin.cesium.tiles.Provider.getInstance();
  provider.addDescriptor(descriptor);

  this.close();
};


/**
 * Close the window.
 * @export
 */
plugin.cesium.ImportIonAssetCtrl.prototype.close = function() {
  os.ui.window.close(this.element_);
};
