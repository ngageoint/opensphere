goog.declareModuleId('os.ui.file.ExportDialogUI');

import {ROOT} from '../../os.js';
import Module from '../module.js';
import * as osWindow from '../window.js';
import WindowEventType from '../windoweventtype.js';
import {launch} from './exportstatus.js';
import exportManager from './uiexportmanager.js';

const {assert} = goog.require('goog.asserts');

const ExportOptions = goog.requireType('os.ex.ExportOptions');


/**
 * The exportdialog directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  replace: true,
  restrict: 'E',
  templateUrl: ROOT + 'views/file/exportdialog.html',
  controller: Controller,
  controllerAs: 'exportdialog'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'exportdialog';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the exportdialog directive
 *
 * @template T
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$compile} $compile
   * @ngInject
   */
  constructor($scope, $element, $compile) {
    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    // how data items will be referenced in the UI - replace this in an extending class if the application has its own
    // terminology (ie, 'features' or 'records')
    $scope['itemText'] = 'item';

    /**
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * @type {?angular.$compile}
     * @protected
     */
    this.compile = $compile;

    /**
     * @type {ExportOptions.<T>}
     * @protected
     */
    this.options = /** @type {ExportOptions.<T>} */ (this.scope['options']);

    /**
     * @type {Object.<string, os.ex.IExportMethod>}
     */
    this['exporters'] = {};

    /**
     * @type {string|undefined}
     */
    this['appName'] = undefined;

    $scope['exporter'] = this.options.exporter;
    $scope['initialExporter'] = !!$scope['exporter'];
    if (!$scope['exporter']) {
      var exporters = exportManager.getExportMethods();
      if (exporters && exporters.length > 0) {
        $scope['exporter'] = exporters[0];

        for (var i = 0, n = exporters.length; i < n; i++) {
          this['exporters'][exporters[i].getLabel()] = exporters[i];
        }
      }
    }

    /**
     * @type {Object.<string, os.ex.IPersistenceMethod>}
     */
    this['persisters'] = {};

    $scope['persister'] = this.options.persister;
    $scope['initialPersister'] = !!$scope['persister'];
    if (!$scope['persister']) {
      var persisters = exportManager.getPersistenceMethods();
      if (persisters && persisters.length > 0) {
        $scope['persister'] = persisters[0];

        for (var i = 0, n = persisters.length; i < n; i++) {
          this['persisters'][persisters[i].getLabel()] = persisters[i];
        }
      }
    }

    /**
     * @type {boolean}
     */
    this['additionalOptions'] = this.options.additionalOptions || false;

    // add application-specific UI
    var customContainer = this.element.find('.js-custom-ui');
    var customOptions = this.getCustomOptions();
    if (customOptions) {
      customContainer.html(customOptions);
      this.compile(customContainer.contents())(this.scope);
    } else {
      customContainer.remove();
    }

    $scope.$emit(WindowEventType.READY);
    $scope.$watch('exporter', this.onExporterChange.bind(this));
    $scope.$watch('persister', this.onPersisterChange.bind(this));
    $scope.$on('$destroy', this.destroy.bind(this));

    // Only listen to this scope change if additional options exist
    if (this.options.additionalOptions) {
      $scope.$on('addexportoptions.updateitem', function(event, items) {
        this.options.items = items || [];
      }.bind(this));
    }
  }

  /**
   * Clean up.
   *
   * @protected
   */
  destroy() {
    this.scope = null;
    this.element = null;
    this.compile = null;
  }

  /**
   * Get the label for the exporter.
   *
   * @return {?string}
   * @export
   */
  getExporterLabel() {
    if (this.scope && this.scope['exporter']) {
      return this.scope['exporter'].getLabel();
    }

    return null;
  }

  /**
   * Get the options UI for the exporter.
   *
   * @return {?string}
   * @export
   */
  getExporterUI() {
    if (this.scope && this.scope['exporter']) {
      return this.scope['exporter'].getUI();
    }

    return null;
  }

  /**
   * Extending classes can use this to provide their own options in the form.
   *
   * @return {?string} The custom options UI as HTML
   * @protected
   */
  getCustomOptions() {
    return null;
  }

  /**
   * Get the keys
   *
   * @param {Object} obj
   * @return {Array} The custom options UI as HTML
   * @export
   */
  getKeys(obj) {
    return obj != null ? Object.keys(obj) : [];
  }

  /**
   * Handle exporter change.
   *
   * @param {os.ex.IExportMethod=} opt_new The new value
   * @param {os.ex.IExportMethod=} opt_old The old value
   * @protected
   */
  onExporterChange(opt_new, opt_old) {
    if (opt_new) {
      this.options.exporter = opt_new;

      // remove the old export ui
      var uiContainer = this.element.find('.js-export-ui__container');
      uiContainer.children().remove();

      // and drop in the new one
      var ui = opt_new.getUI();
      if (ui && this.scope) {
        uiContainer.html(ui);
        this.compile(uiContainer.contents())(this.scope);
      }
    }

    this.options.createDescriptor = !!opt_new;
  }

  /**
   * Handle exporter change.
   *
   * @param {os.ex.IPersistenceMethod=} opt_new The new value
   * @param {os.ex.IPersistenceMethod=} opt_old The old value
   * @protected
   */
  onPersisterChange(opt_new, opt_old) {
    this.options.persister = opt_new;
  }

  /**
   * Fire the cancel callback and close the window.
   *
   * @export
   */
  cancel() {
    this.close_();
  }

  /**
   * Fire the confirmation callback and close the window.
   *
   * @export
   */
  confirm() {
    assert(this.options.exporter != null, 'exporter is not defined');
    assert(this.options.title != null, 'export title is null');
    assert(this.options.items.length > 0, 'no items to export');
    assert(this.options.fields.length > 0, 'no fields defined on export');

    if (this.options.exporter.supportsProgress()) {
      launch(this.options.exporter);
    }

    exportManager.exportItems(this.options);
    this.close_();
  }

  /**
   * Close the window.
   *
   * @private
   */
  close_() {
    osWindow.close(this.element);
  }
}
