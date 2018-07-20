goog.provide('plugin.area.KMLAreaCtrl');
goog.provide('plugin.area.KMLAreaImportUI');

goog.require('os.defines');
goog.require('os.im.Importer');
goog.require('os.im.mapping.RenameMapping');
goog.require('os.parse.FileParserConfig');
goog.require('os.ui.im.FileImportUI');
goog.require('os.ui.query');
goog.require('os.ui.query.cmd.AreaAdd');
goog.require('plugin.area.AreaImportCtrl');
goog.require('plugin.area.KMLAreaParser');



/**
 * @extends {os.ui.im.FileImportUI}
 * @constructor
 */
plugin.area.KMLAreaImportUI = function() {
  plugin.area.KMLAreaImportUI.base(this, 'constructor');

  // file contents are only used in memory, not loaded from storage
  this.requiresStorage = false;

  /**
   * @type {?string}
   * @protected
   */
  this.fileName = '';
};
goog.inherits(plugin.area.KMLAreaImportUI, os.ui.im.FileImportUI);


/**
 * @inheritDoc
 */
plugin.area.KMLAreaImportUI.prototype.getTitle = function() {
  return 'Area Import - KML';
};


/**
 * @inheritDoc
 */
plugin.area.KMLAreaImportUI.prototype.launchUI = function(file, opt_config) {
  var config = new os.parse.FileParserConfig();
  config['file'] = file;
  config['title'] = file.getFileName() || '';

  var callback = goog.partial(this.onPreviewReady_, config);
  var parser = new plugin.area.KMLAreaParser();
  parser.listenOnce(os.events.EventType.COMPLETE, callback, false, this);
  parser.listenOnce(os.events.EventType.ERROR, callback, false, this);
  parser.setSource(file.getContent());
};


/**
 * @param {os.parse.FileParserConfig} config
 * @param {goog.events.Event} event
 * @private
 */
plugin.area.KMLAreaImportUI.prototype.onPreviewReady_ = function(config, event) {
  var parser = /** @type {plugin.area.KMLAreaParser} */ (event.target);
  var preview = parser.parseNext();
  var columns = parser.getColumns() || [];
  goog.dispose(parser);

  config['columns'] = columns;
  config['preview'] = preview;

  var scopeOptions = {
    'config': config
  };
  var windowOptions = {
    'label': 'KML Area Import',
    'icon': 'fa fa-sign-in',
    'x': 'center',
    'y': 'center',
    'width': '450',
    'min-width': '300',
    'max-width': '800',
    'height': 'auto',
    'modal': 'true',
    'show-close': 'true'
  };
  var template = '<kmlarea></kmlarea>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};


/**
 * The KML area import directive
 * @return {angular.Directive}
 */
plugin.area.kmlAreaDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/plugin/kml/kmlarea.html',
    controller: plugin.area.KMLAreaCtrl,
    controllerAs: 'areaFiles'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('kmlarea', [plugin.area.kmlAreaDirective]);



/**
 * Controller for the SHP import file selection step
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout The Angular $timeout service.
 * @extends {plugin.area.AreaImportCtrl<os.parse.FileParserConfig>}
 * @constructor
 * @ngInject
 */
plugin.area.KMLAreaCtrl = function($scope, $element, $timeout) {
  plugin.area.KMLAreaCtrl.base(this, 'constructor', $scope, $element, $timeout);
};
goog.inherits(plugin.area.KMLAreaCtrl, plugin.area.AreaImportCtrl);


/**
 * @inheritDoc
 * @export
 */
plugin.area.KMLAreaCtrl.prototype.finish = function() {
  plugin.area.KMLAreaCtrl.base(this, 'finish');

  var parser = new plugin.area.KMLAreaParser();
  var importer = new os.im.Importer(parser);
  importer.listenOnce(os.events.EventType.COMPLETE, this.onImportComplete_, false, this);
  importer.startImport(this.config['file'].getContent());
};


/**
 * @inheritDoc
 */
plugin.area.KMLAreaCtrl.prototype.getFileName = function() {
  return this.config['file'] && this.config['file'].getFileName() || undefined;
};


/**
 * Success callback for importing data. Adds the areas to Area Manager
 * @param {goog.events.Event} event
 * @private
 */
plugin.area.KMLAreaCtrl.prototype.onImportComplete_ = function(event) {
  var importer = /** @type {os.im.Importer} */ (event.target);
  var features = /** @type {!Array<ol.Feature>} */ (importer.getData() || []);
  importer.dispose();

  this.processFeatures(features);
  this.close();
};
