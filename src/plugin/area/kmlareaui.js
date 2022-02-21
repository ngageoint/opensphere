goog.declareModuleId('plugin.area.KMLAreaUI');

import '../../os/ui/im/mergeareaoption.js';
import EventType from '../../os/events/eventtype.js';
import Importer from '../../os/im/importer.js';
import {ROOT} from '../../os/os.js';
import Module from '../../os/ui/module.js';
import AreaImportCtrl from './areaimportctrl.js';
import KMLAreaParser from './kmlareaparser.js';


/**
 * The KML area import directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/plugin/kml/kmlarea.html',
  controller: Controller,
  controllerAs: 'areaFiles'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'kmlarea';


/**
 * Add the directive to the module
 */
Module.directive('kmlarea', [directive]);



/**
 * Controller for the SHP import file selection step
 *
 * @extends {AreaImportCtrl<FileParserConfig>}
 * @unrestricted
 */
export class Controller extends AreaImportCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout The Angular $timeout service.
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element, $timeout);
  }

  /**
   * @inheritDoc
   * @export
   */
  finish() {
    super.finish();

    var parser = new KMLAreaParser();
    var importer = new Importer(parser);
    importer.listenOnce(EventType.COMPLETE, this.onImportComplete_, false, this);
    importer.startImport(this.config['file'].getContent());
  }

  /**
   * @inheritDoc
   */
  getFileName() {
    return this.config['file'] && this.config['file'].getFileName() || undefined;
  }

  /**
   * Success callback for importing data. Adds the areas to Area Manager
   *
   * @param {goog.events.Event} event
   * @private
   */
  onImportComplete_(event) {
    var importer = /** @type {Importer} */ (event.target);
    var features = /** @type {!Array<ol.Feature>} */ (importer.getData() || []);
    importer.dispose();

    this.processFeatures(features);
    this.close();
  }
}
