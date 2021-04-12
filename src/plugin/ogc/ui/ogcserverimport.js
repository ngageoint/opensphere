goog.provide('plugin.ogc.ui.OgcServerImportCtrl');
goog.provide('plugin.ogc.ui.ogcserverDirective');

goog.require('goog.dom.xml');
goog.require('os');
goog.require('os.ui.Module');
goog.require('os.ui.ProviderImportCtrl');
goog.require('os.ui.WindowEventType');
goog.require('os.ui.ogc.OGCServer');
goog.require('os.ui.singleUrlFormDirective');
goog.require('os.ui.window');
goog.require('plugin.ogc.ui.OgcServerHelpUI');


/**
 * The ogcserver import directive
 *
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
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.ProviderImportCtrl}
 * @constructor
 * @ngInject
 */
plugin.ogc.ui.OgcServerImportCtrl = function($scope, $element) {
  plugin.ogc.ui.OgcServerImportCtrl.base(this, 'constructor', $scope, $element);
  this['helpUi'] = plugin.ogc.ui.OgcServerHelpUI.directiveTag;

  $scope['typeName'] = 'OGC Server';

  $scope['config']['type'] = 'ogc';
  var file = /** @type {os.file.File} */ ($scope['config']['file']);

  if (file) {
    var content = file.getContent();
    var url = file.getUrl();

    if (content && typeof content === 'string') {
      var titles = content.match(/title>([^<]*)<\//i);

      if (titles && titles.length > 1) {
        $scope['config']['label'] = titles[1];
      }

      try {
        const doc = goog.dom.xml.loadXml(content);
        if (doc && doc.firstElementChild) {
          const rootNodeName = doc.firstElementChild.nodeName;

          if (os.ogc.GetCapsRootRegexp.WMS.test(rootNodeName) || /wms/i.test(url)) {
            $scope['config']['wms'] = url;
          } else if (os.ogc.GetCapsRootRegexp.WMTS.test(rootNodeName) || /wmts/i.test(url)) {
            $scope['config']['wmts'] = url;
          } else if (os.ogc.GetCapsRootRegexp.WFS.test(rootNodeName) || /wfs/i.test(url)) {
            $scope['config']['wfs'] = url;
          }
        }
      } catch (e) {

      }
    }
  } else if (this.dp) {
    $scope['config']['label'] = this.dp.getLabel();

    $scope['config']['wms'] = this.dp.getWmsUrl();
    $scope['config']['wmts'] = this.dp.getWmtsUrl();
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
plugin.ogc.ui.OgcServerImportCtrl.prototype.getWmtsUrl = function() {
  return this.dp ? /** @type {os.ui.ogc.OGCServer} */ (this.dp).getOriginalWmtsUrl() : '';
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
  var fields = ['label', 'enabled', 'type', 'wms', 'wmts', 'wfs'];
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
  // If any of the urls change, re-test
  return this.getWmtsUrl() !== this.scope['config']['wmts'] ||
      this.getWmsUrl() !== this.scope['config']['wms'] ||
      this.getWfsUrl() !== this.scope['config']['wfs'];
};


/**
 * @inheritDoc
 */
plugin.ogc.ui.OgcServerImportCtrl.prototype.saveAndClose = function() {
  /** @type {os.structs.TreeNode} */ (this.dp).setLabel(this.scope['config']['label']);
  this.dp.setWmtsUrl(this.scope['config']['wmts']);
  this.dp.setWmsUrl(this.scope['config']['wms']);
  this.dp.setWfsUrl(this.scope['config']['wfs']);
  this.dp.setOriginalWmtsUrl(this.scope['config']['wmts']);
  this.dp.setOriginalWmsUrl(this.scope['config']['wms']);
  this.dp.setOriginalWfsUrl(this.scope['config']['wfs']);
  plugin.ogc.ui.OgcServerImportCtrl.base(this, 'saveAndClose');
};
