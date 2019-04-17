goog.provide('plugin.file.kml.ui.KMLTreeExportCtrl');
goog.provide('plugin.file.kml.ui.kmlTreeExportDirective');

goog.require('goog.asserts');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.window');
goog.require('plugin.file.kml.KMLTreeExporter');
goog.require('plugin.file.kml.ui.kmlExportDirective');


/**
 * The kmltreeexport directive
 * @return {angular.Directive}
 */
plugin.file.kml.ui.kmlTreeExportDirective = function() {
  return {
    restrict: 'E',
    scope: {
      'rootNode': '='
    },
    templateUrl: os.ROOT + 'views/plugin/kml/kmltreeexport.html',
    controller: plugin.file.kml.ui.KMLTreeExportCtrl,
    controllerAs: 'treeExport'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('kmltreeexport', [plugin.file.kml.ui.kmlTreeExportDirective]);


/**
 * Launch a KML tree export dialog.
 * @param {!plugin.file.kml.ui.KMLNode} rootNode The root node to export.
 * @param {string=} opt_winLabel The window label
 */
plugin.file.kml.ui.launchTreeExport = function(rootNode, opt_winLabel) {
  var scopeOptions = {
    'rootNode': rootNode
  };

  var windowOptions = {
    'label': opt_winLabel || 'Export KML Tree',
    'icon': 'fa fa-download',
    'x': 'center',
    'y': 'center',
    'width': 400,
    'min-width': 300,
    'max-width': 2000,
    'height': 'auto',
    'show-close': true
  };

  var template = '<kmltreeexport root-node="rootNode"></kmltreeexport>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};



/**
 * Controller function for the kmltreeexport directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 * @template T
 */
plugin.file.kml.ui.KMLTreeExportCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  var root = /** @type {plugin.file.kml.ui.KMLNode} */ (this.scope['rootNode']);

  /**
   * @type {string}
   */
  this['title'] = root && root.getLabel() || (os.config.getAppName() + ' KML Tree').trim();

  /**
   * @type {boolean}
   */
  this['savedplaces'] = this['title'] == 'Saved Places' ? true : false;

  /**
   * @type {!plugin.file.kml.KMLTreeExporter}
   */
  this['exporter'] = new plugin.file.kml.KMLTreeExporter();

  /**
   * @type {!Object<string, os.ex.IPersistenceMethod>}
   */
  this['persisters'] = {};

  /**
   * @type {os.ex.IPersistenceMethod}
   */
  this['persister'] = null;

  var persisters = os.ui.exportManager.getPersistenceMethods();
  if (persisters && persisters.length > 0) {
    this['persister'] = persisters[0];

    for (var i = 0, n = persisters.length; i < n; i++) {
      this['persisters'][persisters[i].getLabel()] = persisters[i];
    }
  }

  $scope.$on('$destroy', this.destroy.bind(this));

  // fire auto height event
  setTimeout(function() {
    $scope.$emit(os.ui.WindowEventType.READY);
  }, 0);
};


/**
 * Clean up.
 * @protected
 */
plugin.file.kml.ui.KMLTreeExportCtrl.prototype.destroy = function() {
  this.scope = null;
  this.element = null;
};


/**
 * Fire the cancel callback and close the window.
 * @export
 */
plugin.file.kml.ui.KMLTreeExportCtrl.prototype.cancel = function() {
  this.close_();
};


/**
 * Fire the confirmation callback and close the window.
 * @export
 */
plugin.file.kml.ui.KMLTreeExportCtrl.prototype.confirm = function() {
  goog.asserts.assert(this.scope != null, 'scope is not defined');
  goog.asserts.assert(this.scope['rootNode'] != null, 'KML root is not defined');
  goog.asserts.assert(this['exporter'] != null, 'exporter is not defined');
  goog.asserts.assert(this['persister'] != null, 'persister is not defined');
  goog.asserts.assert(!!this['title'], 'export title is empty/null');

  var root = /** @type {plugin.file.kml.ui.KMLNode} */ (this.scope['rootNode']);
  if (root) {
    var items = root.getChildren() || [root];
    os.ui.exportManager.exportItems(items, null, this['title'], this['exporter'], this['persister']);
    this.close_();
  }
};


/**
 * Close the window.
 * @private
 */
plugin.file.kml.ui.KMLTreeExportCtrl.prototype.close_ = function() {
  os.ui.window.close(this.element);
};
