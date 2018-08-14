goog.provide('plugin.ogc.ui.OgcServerImportCtrl');
goog.provide('plugin.ogc.ui.ogcserverDirective');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.ProviderImportCtrl');
goog.require('os.ui.WindowEventType');
goog.require('os.ui.ogc.OGCServer');
goog.require('os.ui.window');


/**
 * The ogcserver import directive
 * @return {angular.Directive}
 */
plugin.ogc.ui.ogcserverDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/plugin/ogc/ui/ogcserverimport.html',
    controller: plugin.ogc.ui.OgcServerImportCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('ogcserver', [plugin.ogc.ui.ogcserverDirective]);



/**
 * Controller for the ogcserver import dialog
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.ProviderImportCtrl}
 * @constructor
 * @ngInject
 */
plugin.ogc.ui.OgcServerImportCtrl = function($scope, $element) {
  plugin.ogc.ui.OgcServerImportCtrl.base(this, 'constructor', $scope, $element);

  $scope['config']['type'] = 'ogc';
  var file = /** @type {os.file.File} */ ($scope['config']['file']);

  if (file) {
    var content = file.getContent();
    var url = file.getUrl();

    if (content) {
      var titles = content.match(/title>([^<]*)<\//i);

      if (titles && titles.length > 1) {
        $scope['config']['label'] = titles[1];
      }

      if (content.search(/wms/gi) != -1 || url.search(/wms/gi) != -1) {
        $scope['config']['wms'] = file.getUrl();
      } else if (content.search(/wfs/gi) != -1 || url.search(/wfs/gi) != -1) {
        $scope['config']['wfs'] = file.getUrl();
      }
    }
  } else if (this.dp) {
    $scope['config']['label'] = this.dp.getLabel();
    $scope['config']['wms'] = this.dp.getWmsUrl();
    $scope['config']['wfs'] = this.dp.getWfsUrl();
  }

  // focus the form
  this.element.find('input[name="title"]').focus();
};
goog.inherits(plugin.ogc.ui.OgcServerImportCtrl, os.ui.ProviderImportCtrl);


/**
 * @inheritDoc
 */
plugin.ogc.ui.OgcServerImportCtrl.prototype.getDataProvider = function() {
  var dp = this.dp || new os.ui.ogc.OGCServer();
  dp.configure(this.scope['config']);
  return dp;
};


/**
 * @return {string}
 */
plugin.ogc.ui.OgcServerImportCtrl.prototype.getWmsUrl = function() {
  return this.dp ? /** @type {os.ui.ogc.OGCServer} */ (this.dp).getOriginalWmsUrl() : '';
};


/**
 * @return {string}
 */
plugin.ogc.ui.OgcServerImportCtrl.prototype.getWfsUrl = function() {
  return this.dp ? /** @type {os.ui.ogc.OGCServer} */ (this.dp).getOriginalWfsUrl() : '';
};


/**
 * @inheritDoc
 */
plugin.ogc.ui.OgcServerImportCtrl.prototype.getConfig = function() {
  var conf = {};
  var fields = ['label', 'enabled', 'type', 'wms', 'wfs'];
  var original = this.scope['config'];

  for (var key in original) {
    if (fields.indexOf(key) > -1) {
      conf[key] = original[key];
    }
  }

  return conf;
};


/**
 * @inheritDoc
 */
plugin.ogc.ui.OgcServerImportCtrl.prototype.formDiff = function() {
  // If either of the urls change, re-test
  return this.getWmsUrl() !== this.scope['config']['wms'] || this.getWfsUrl() !== this.scope['config']['wfs'];
};


/**
 * @inheritDoc
 */
plugin.ogc.ui.OgcServerImportCtrl.prototype.saveAndClose = function() {
  /** @type {os.structs.TreeNode} */ (this.dp).setLabel(this.scope['config']['label']);
  this.dp.setWmsUrl(this.scope['config']['wms']);
  this.dp.setWfsUrl(this.scope['config']['wfs']);
  this.dp.setOriginalWmsUrl(this.scope['config']['wms']);
  this.dp.setOriginalWfsUrl(this.scope['config']['wfs']);
  plugin.ogc.ui.OgcServerImportCtrl.base(this, 'saveAndClose');
};
