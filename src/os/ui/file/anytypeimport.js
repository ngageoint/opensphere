goog.declareModuleId('os.ui.file.AnyTypeImport');

import AlertEventSeverity from '../../alert/alerteventseverity.js';
import AlertManager from '../../alert/alertmanager.js';
import {isZip} from '../../file/mime/zip.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';
import * as osWindow from '../window.js';
import WindowEventType from '../windoweventtype.js';

const {default: IImportUI} = goog.requireType('os.ui.im.IImportUI');


/**
 * The KML import directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/file/anytypeimport.html',
  controller: Controller,
  controllerAs: 'anytype'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'anytypeimport';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the KML import dialog
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    /**
     * @type {?IImportUI}
     * @private
     */
    this['import'] = null;

    this.scope_['isZip'] = this.scope_['file'] ? isZip(this.scope_['file'].getContent()) : false;
  }

  /**
   * The Angular $onDestroy lifecycle function.
   */
  $onDestroy() {
    this.scope_ = null;
    this.element_ = null;
  }

  /**
   * The Angular $onInit lifecycle function.
   */
  $onInit() {
    if (this.scope_) {
      this.scope_.$emit(WindowEventType.READY);
    }
  }

  /**
   * Open the correct importer
   *
   * @export
   */
  accept() {
    try {
      this['import'].launchUI(/** @type {os.file.File} */ (this.scope_['file']), this.scope_['config']);
    } catch (e) {
      AlertManager.getInstance().sendAlert(
          'Error loading file: <b>' + this.scope_['file'].getFileName() + '</b>', AlertEventSeverity.ERROR);
    }

    this.close();
  }

  /**
   * Open the correct importer
   *
   * @export
   */
  close() {
    osWindow.close(this.element_);
  }

  /**
   * Get the title for an import UI.
   * @param {IImportUI} importer The import UI.
   * @return {string} The title.
   * @export
   */
  getTitle(importer) {
    return importer.getTitle();
  }
}
