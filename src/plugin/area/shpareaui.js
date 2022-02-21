goog.declareModuleId('plugin.area.SHPAreaUI');

import '../../os/ui/im/mergeareaoption.js';
import EventType from '../../os/events/eventtype.js';
import Importer from '../../os/im/importer.js';
import {ROOT} from '../../os/os.js';
import Module from '../../os/ui/module.js';
import {apply} from '../../os/ui/ui.js';
import WizardStepEvent from '../../os/ui/wiz/step/wizardstepevent.js';
import SHPParser from '../file/shp/shpparser.js';
import AreaImportCtrl from './areaimportctrl.js';


/**
 * The SHP import file selection area directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/plugin/shp/shparea.html',
  controller: Controller,
  controllerAs: 'areaFiles'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'shparea';


/**
 * Add the directive to the module
 */
Module.directive('shparea', [directive]);


/**
 * Controller for the SHP import file selection step
 *
 * @extends {AreaImportCtrl<SHPParserConfig>}
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

    this.scope.$on(WizardStepEvent.VALIDATE, this.onFileChange_.bind(this));

    // If this is the zip file, run the preview
    if (this.config['zipFile']) {
      this.config.updateZipPreview(apply.bind(this, this.scope));
    }
  }

  /**
   * Update Title/Description
   *
   * @param {angular.Scope.Event} event The Angular event
   * @param {boolean} valid
   * @private
   */
  onFileChange_(event, valid) {
    this.config.updatePreview();
    apply(this.scope);
  }

  /**
   * Validate the done button
   *
   * @return {boolean} if the form is valid
   * @export
   */
  invalid() {
    var config = this.config;
    if (config['zipFile']) {
      return !config['columns'] || config['columns'].length == 0 || (!config['title'] && !config['titleColumn']);
    } else {
      return !config['file'] || !config['file2'] || (!config['title'] && !config['titleColumn']);
    }
  }

  /**
   * @inheritDoc
   * @export
   */
  finish() {
    super.finish();

    var parser = new SHPParser(this.config);
    var importer = new Importer(parser);
    importer.listenOnce(EventType.COMPLETE, this.onImportComplete_, false, this);

    if (this.config['zipFile']) {
      importer.startImport(this.config['zipFile'].getContent());
    } else {
      importer.startImport([this.config['file'].getContent(), this.config['file2'].getContent()]);
    }
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
