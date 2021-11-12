goog.declareModuleId('plugin.places.KMLPlacesImportUI');

import EventType from '../../os/events/eventtype.js';
import {ROOT} from '../../os/os.js';
import FileParserConfig from '../../os/parse/fileparserconfig.js';
import {Controller as FileImportCtrl} from '../../os/ui/file/fileimport.js';
import FileImportUI from '../../os/ui/im/fileimportui.js';
import Module from '../../os/ui/module.js';
import {create} from '../../os/ui/window.js';
import KMLImporter from '../file/kml/kmlimporter.js';
import KMLParser from '../file/kml/kmlparser.js';
import {getPlacesManager} from './places.js';
import {saveKMLToPlaces} from './placessave.js';

const dispose = goog.require('goog.dispose');

const {default: KMLNode} = goog.requireType('plugin.file.kml.ui.KMLNode');


/**
 */
export default class KMLPlacesImportUI extends FileImportUI {
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
    create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
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
    const parser = new KMLParser({});
    const importer = new KMLImporter(parser);
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
    const importer = /** @type {KMLImporter} */ (event.target);
    const rootNode = getImportRoot(importer.getRootNode());
    const placesManager = getPlacesManager();
    const placesRoot = placesManager ? placesManager.getPlacesRoot() : null;
    if (rootNode && placesRoot) {
      saveKMLToPlaces(rootNode);
    }

    importer.dispose();
    this.close();
  }
}

/**
 * Get the root KML node to import.
 * @param {KMLNode} node The root KML node to import.
 * @return {KMLNode}
 */
const getImportRoot = (node) => {
  if (node && node.getLabel() === 'kmlroot' || node.getLabel() === 'Saved Places') {
    const children = node.getChildren();
    if (children && children.length === 1) {
      return getImportRoot(children[0]);
    }
  }

  return node;
};
