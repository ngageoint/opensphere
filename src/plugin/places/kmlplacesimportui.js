goog.provide('plugin.places.KMLPlacesCtrl');
goog.provide('plugin.places.KMLPlacesImportUI');

goog.require('os.command.SequenceCommand');
goog.require('os.defines');
goog.require('os.im.Importer');
goog.require('os.im.mapping.RenameMapping');
goog.require('os.parse.FileParserConfig');
goog.require('os.ui.file.FileImportCtrl');
goog.require('os.ui.im.FileImportUI');
goog.require('os.ui.query');
goog.require('plugin.file.kml.KMLParser');
goog.require('plugin.file.kml.cmd.KMLNodeAdd');



/**
 * @extends {os.ui.im.FileImportUI}
 * @constructor
 */
plugin.places.KMLPlacesImportUI = function() {
  plugin.places.KMLPlacesImportUI.base(this, 'constructor');

  // file contents are only used in memory, not loaded from storage
  this.requiresStorage = false;

  /**
   * @type {?string}
   * @protected
   */
  this.fileName = '';
};
goog.inherits(plugin.places.KMLPlacesImportUI, os.ui.im.FileImportUI);


/**
 * @inheritDoc
 */
plugin.places.KMLPlacesImportUI.prototype.getTitle = function() {
  return 'Place Import - KML';
};


/**
 * @inheritDoc
 */
plugin.places.KMLPlacesImportUI.prototype.launchUI = function(file, opt_config) {
  plugin.places.KMLPlacesImportUI.base(this, 'launchUI', file, opt_config);

  var config = new os.parse.FileParserConfig();
  config['file'] = file;
  config['title'] = file.getFileName() || '';

  var callback = goog.partial(this.onPreviewReady_, config);
  var parser = new plugin.file.kml.KMLParser({});
  parser.listenOnce(os.events.EventType.COMPLETE, callback, false, this);
  parser.listenOnce(os.events.EventType.ERROR, callback, false, this);
  parser.setSource(file.getContent());
};


/**
 * @param {os.parse.FileParserConfig} config
 * @param {goog.events.Event} event
 * @private
 */
plugin.places.KMLPlacesImportUI.prototype.onPreviewReady_ = function(config, event) {
  var parser = /** @type {plugin.file.kml.KMLParser} */ (event.target);
  var preview = parser.parseNext();
  var columns = parser.getColumns() || [];
  goog.dispose(parser);

  this.config = config;
  config['columns'] = columns;
  config['preview'] = preview;

  var scopeOptions = {
    'config': config
  };
  var windowOptions = {
    'label': 'KML Places Import',
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
  var template = '<kmlplaces></kmlplaces>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};


/**
 * The KML places import directive
 * @return {angular.Directive}
 */
plugin.places.kmlPlacesDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/plugin/kml/kmlplaces.html',
    controller: plugin.places.KMLPlacesCtrl,
    controllerAs: 'placesFiles'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('kmlplaces', [plugin.places.kmlPlacesDirective]);



/**
 * Controller for the SHP import file selection step
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout The Angular $timeout service.
 * @extends {os.ui.file.FileImportCtrl}
 * @constructor
 * @ngInject
 */
plugin.places.KMLPlacesCtrl = function($scope, $element, $timeout) {
  plugin.places.KMLPlacesCtrl.base(this, 'constructor', $scope, $element, $timeout);
  this.config = $scope.config;
};
goog.inherits(plugin.places.KMLPlacesCtrl, os.ui.file.FileImportCtrl);


/**
 * @export
 */
plugin.places.KMLPlacesCtrl.prototype.finish = function() {
  var parser = new plugin.file.kml.KMLParser({});
  var importer = new os.im.Importer(parser);
  importer.listenOnce(os.events.EventType.COMPLETE, this.onImportComplete_, false, this);
  importer.startImport(this.config['file'].getContent());
};


/**
 * Success callback for importing data.
 * @param {goog.events.Event} event
 * @private
 */
plugin.places.KMLPlacesCtrl.prototype.onImportComplete_ = function(event) {
  var importer = /** @type {os.im.Importer} */ (event.target);
  var nodes = importer.getData();
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].label == 'kmlroot' || nodes[i].label == 'Saved Places') {
      nodes.splice(i, 1);
      i--;
    }
  }
  // plugin.places.menu.saveKMLToPlaces_(nodes);
  var rootNode = plugin.places.PlacesManager.getInstance().getPlacesRoot();
  if (rootNode) {
    var cmds = [];
    for (var i = 0; i < nodes.length; i++) {
      var cmd = new plugin.file.kml.cmd.KMLNodeAdd(nodes[i], rootNode);
      cmd.title = 'Save ' + nodes[i].getLabel() + ' to Places';
      cmds.push(cmd);
    }
    var seq = new os.command.SequenceCommand();
    seq.setCommands(cmds);
    os.command.CommandProcessor.getInstance().addCommand(seq);
  }

  importer.dispose();
  this.close();
};
