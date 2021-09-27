goog.declareModuleId('plugin.area.GeoJSONAreaImport');

import Module from '../../os/ui/module.js';
import * as osWindow from '../../os/ui/window.js';
import {directive as wizardDirective, Controller as WizardController} from '../../os/ui/wiz/wizard.js';
import GeoJSONParser from '../file/geojson/geojsonparser.js';
import {processFeatures} from './area.js';

const RecordField = goog.require('os.data.RecordField');
const EventType = goog.require('os.events.EventType');
const Importer = goog.require('os.im.Importer');


/**
 * Controller for the GeoJSON import wizard window
 *
 * @extends {WizardController<T>}
 * @template T,S
 * @unrestricted
 */
export class Controller extends WizardController {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @param {!Object.<string, string>} $attrs
   * @ngInject
   */
  constructor($scope, $element, $timeout, $attrs) {
    super($scope, $element, $timeout, $attrs);
  }

  /**
   * @inheritDoc
   */
  finish() {
    this['loading'] = true;

    var parser = new GeoJSONParser();
    var importer = new Importer(parser);
    importer.setMappings(this.scope['config']['mappings']);
    importer.listenOnce(EventType.COMPLETE, this.onImportComplete_, false, this);
    importer.startImport(this.scope['config']['file'].getContent());
  }

  /**
   * Success callback for importing data. Adds the areas to Area Manager
   *
   * @param {goog.events.Event} event
   * @private
   */
  onImportComplete_(event) {
    var importer = /** @type {Importer} */ (event.target);
    var features = /** @type {!Array<ol.Feature>} */ (importer.getData());
    importer.dispose();

    if (features && features.length > 0) {
      this.scope['config'][RecordField.SOURCE_NAME] = this.scope['config']['file'].getFileName();
      processFeatures(features, this.scope['config']);
    }

    osWindow.close(this.element);
  }
}

/**
 * The geojson import wizard directive.
 *
 * @return {angular.Directive}
 */
export const directive = () => {
  var dir = wizardDirective();
  dir.controller = Controller;
  return dir;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'geojsonareaimport';


/**
 * Add the directive to the module
 */
Module.directive('geojsonareaimport', [directive]);
