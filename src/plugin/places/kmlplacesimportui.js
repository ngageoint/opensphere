goog.module('plugin.places.KMLPlacesImportUI');

const dispose = goog.require('goog.dispose');
const {ROOT} = goog.require('os');
const CommandProcessor = goog.require('os.command.CommandProcessor');
const SequenceCommand = goog.require('os.command.SequenceCommand');
const EventType = goog.require('os.events.EventType');
const Importer = goog.require('os.im.Importer');
const FileParserConfig = goog.require('os.parse.FileParserConfig');
const Module = goog.require('os.ui.Module');
const {Controller: FileImportCtrl} = goog.require('os.ui.file.FileImportUI');
const FileImportUI = goog.require('os.ui.im.FileImportUI');
const osWindow = goog.require('os.ui.window');
const KMLParser = goog.require('plugin.file.kml.KMLParser');
const KMLNodeAdd = goog.require('plugin.file.kml.cmd.KMLNodeAdd');
const {updatePlacemark} = goog.require('plugin.file.kml.ui');
const {getPlacesManager} = goog.require('plugin.places');


/**
 */
class KMLPlacesImportUI extends FileImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();

    // file contents are only used in memory, not loaded from storage
    this.requiresStorage = false;

    /**
     * @type {?string}
     * @protected
     */
    this.fileName = '';

    /**
     * The parser config.
     * @type {FileParserConfig}
     * @protected
     */
    this.config = null;
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return 'Place Import - KML';
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    super.launchUI(file, opt_config);

    var config = new FileParserConfig();
    config['file'] = file;
    config['title'] = file.getFileName() || '';

    var callback = goog.partial(this.onPreviewReady_, config);
    var parser = new KMLParser({});
    parser.listenOnce(EventType.COMPLETE, callback, false, this);
    parser.listenOnce(EventType.ERROR, callback, false, this);
    parser.setSource(file.getContent());
  }

  /**
   * @param {FileParserConfig} config
   * @param {goog.events.Event} event
   * @private
   */
  onPreviewReady_(config, event) {
    var parser = /** @type {KMLParser} */ (event.target);
    var preview = parser.parseNext();
    var columns = parser.getColumns() || [];
    dispose(parser);

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
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
}


/**
 * The KML places import directive
 *
 * @return {angular.Directive}
 */
const kmlPlacesDirective = function() {
  return {
    restrict: 'E',
    templateUrl: ROOT + 'views/plugin/kml/kmlplaces.html',
    controller: Controller,
    controllerAs: 'placesFiles'
  };
};


/**
 * Add the directive to the module
 */
Module.directive('kmlplaces', [kmlPlacesDirective]);



/**
 * Controller for the SHP import file selection step
 * @unrestricted
 */
class Controller extends FileImportCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout The Angular $timeout service.
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element, $timeout);
    this.config = $scope.config;
  }

  /**
   * @export
   */
  finish() {
    var parser = new KMLParser({});
    var importer = new Importer(parser);
    importer.listenOnce(EventType.COMPLETE, this.onImportComplete_, false, this);
    importer.startImport(this.config['file'].getContent());
  }

  /**
   * Success callback for importing data.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onImportComplete_(event) {
    var importer = /** @type {Importer} */ (event.target);
    var nodes = importer.getData();
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].label == 'kmlroot' || nodes[i].label == 'Saved Places') {
        nodes.splice(i, 1);
        i--;
      }
    }
    var placesManager = getPlacesManager();
    var rootNode = placesManager ? placesManager.getPlacesRoot() : null;
    if (rootNode) {
      var cmds = [];
      for (var i = 0; i < nodes.length; i++) {
        var feature = nodes[i].getFeature();
        if (feature) {
          nodes[i] = updatePlacemark({
            'feature': feature,
            'node': nodes[i],
            'parent': nodes[i].getParent()
          });
          nodes[i].canAddChildren = false;
          nodes[i].editable = true;
          nodes[i].internalDrag = true;
          nodes[i].removable = true;

          var cmd = new KMLNodeAdd(nodes[i], rootNode);
          cmd.title = 'Save ' + nodes[i].getLabel() + ' to Places';
          cmds.push(cmd);
        }
      }
      var seq = new SequenceCommand();
      seq.setCommands(cmds);
      CommandProcessor.getInstance().addCommand(seq);
    }

    importer.dispose();
    this.close();
  }
}

exports = KMLPlacesImportUI;
