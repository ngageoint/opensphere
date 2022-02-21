goog.declareModuleId('plugin.file.kml.ui.KMLTreeExportUI');

import * as config from '../../../../os/config/config.js';
import {ROOT} from '../../../../os/os.js';
import exportManager from '../../../../os/ui/file/uiexportmanager.js';
import Module from '../../../../os/ui/module.js';
import * as osWindow from '../../../../os/ui/window.js';
import WindowEventType from '../../../../os/ui/windoweventtype.js';
import KMLTreeExporter from '../kmltreeexporter.js';

const asserts = goog.require('goog.asserts');


/**
 * The kmltreeexport directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  scope: {
    'rootNode': '=',
    'options': '='
  },
  templateUrl: ROOT + 'views/plugin/kml/kmltreeexport.html',
  controller: Controller,
  controllerAs: 'treeExport'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'kmltreeexport';


/**
 * Add the directive to the module.
 */
Module.directive('kmltreeexport', [directive]);


/**
 * Launch a KML tree export dialog.
 * @param {!KMLNode} rootNode The root node to export.
 * @param {string=} opt_winLabel The window label
 * @param {ExportOptions=} opt_addOptions
 * @param {string=} opt_windowTooltip The tooltip for the window, if any.
 */
export const launchTreeExport = function(rootNode, opt_winLabel, opt_addOptions, opt_windowTooltip) {
  var scopeOptions = {
    'rootNode': rootNode,
    'options': opt_addOptions
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
  if (opt_windowTooltip) {
    windowOptions['window-tooltip'] = opt_windowTooltip;
  }

  var template = `<${directiveTag} root-node="rootNode" options="options"></${directiveTag}>`;
  osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};

/**
 * Controller function for the kmltreeexport directive
 *
 * @template T
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
     * @protected
     */
    this.scope = $scope;

    /**
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    var root = /** @type {KMLNode} */ (this.scope['rootNode']);

    /**
     * @type {string}
     */
    this['title'] = root && root.getLabel() || (config.getAppName() + ' KML Tree').trim();

    /**
     * @type {!Object<string, IPersistenceMethod>}
     */
    this['persisters'] = {};

    /**
     * @type {IPersistenceMethod}
     */
    this['persister'] = null;

    const options = this.scope['options'];

    /**
     * @type {!KMLTreeExporter}
     */
    this['exporter'] = new KMLTreeExporter();

    /**
     * @type {Array.<string>}
     */
    this['exportFields'] = options && options.fields || null;

    /**
     * @type {boolean}
     */
    this['additionalOptions'] = (options && options.additionalOptions) || false;

    /**
     * The data to be exported
     * @type {boolean}
     */
    this.scope['exportData'] = this.scope['rootNode'].getChildren();

    var persisters = exportManager.getPersistenceMethods();
    if (persisters && persisters.length > 0) {
      this['persister'] = persisters[0];

      for (var i = 0, n = persisters.length; i < n; i++) {
        this['persisters'][persisters[i].getLabel()] = persisters[i];
      }
    }

    $scope.$on('$destroy', this.destroy.bind(this));

    // Don't listen for this if we don't have additional options
    if (this['additionalOptions']) {
      $scope.$on('addexportoptions.updateitem', function(event, items) {
        this.scope['exportData'] = items || [];
      }.bind(this));
    }

    // fire auto height event
    setTimeout(function() {
      $scope.$emit(WindowEventType.READY);
    }, 0);
  }

  /**
   * Clean up.
   *
   * @protected
   */
  destroy() {
    this.scope = null;
    this.element = null;
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
    asserts.assert(this.scope != null, 'scope is not defined');
    asserts.assert(this.scope['rootNode'] != null, 'KML root is not defined');
    asserts.assert(this['exporter'] != null, 'exporter is not defined');
    asserts.assert(this['persister'] != null, 'persister is not defined');
    asserts.assert(!!this['title'], 'export title is empty/null');

    var root = /** @type {KMLNode} */ (this.scope['rootNode']);
    if (root) {
      var items = root.getChildren() || [root];
      items = this['additionalOptions'] ? this.scope['exportData'] : items;

      var options = /** @type {ExportOptions} */ ({
        items: items,
        fields: this['exportFields'],
        title: this['title'],
        exporter: this['exporter'],
        persister: this['persister']
      });

      exportManager.exportItems(options);
      this.close_();
    }
  }

  /**
   * Close the window.
   *
   * @private
   */
  close_() {
    osWindow.close(this.element);
  }

  /**
   * Disables the OK button.
   * @return {boolean}
   * @export
   */
  disable() {
    if (this['additionalOptions'] && this.scope['exportData']) {
      return this.scope['exportData'].length <= 0;
    } else {
      return false;
    }
  }
}
