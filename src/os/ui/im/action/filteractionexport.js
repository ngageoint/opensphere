goog.declareModuleId('os.ui.im.action.FilterActionExportUI');

import AlertEventSeverity from '../../../alert/alerteventseverity.js';
import AlertManager from '../../../alert/alertmanager.js';
import {saveFile} from '../../../file/persist/persist.js';
import {testFilterActionEnabled} from '../../../im/action/importaction.js';
import ImportActionManager from '../../../im/action/importactionmanager.js';
import {ROOT} from '../../../os.js';
import {createElementNS, serialize} from '../../../xml.js';
import Module from '../../module.js';
import {close, create} from '../../window.js';
import WindowEventType from '../../windoweventtype.js';
import {exportEntries} from './filteraction.js';
import FilterActionExportType from './filteractionexporttype.js';

const Disposable = goog.require('goog.Disposable');

const {default: FilterActionEntry} = goog.requireType('os.im.action.FilterActionEntry');


/**
 * The filteractionexport directive.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  templateUrl: ROOT + 'views/im/action/filteractionexport.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'filteractionexport';


/**
 * Add the directive to the module.
 */
Module.directive('filteractionexport', [directive]);



/**
 * Controller function for the filteractionexport directive
 * @unrestricted
 */
export class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super();

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

    /**
     * The export type.
     * @type {number}
     */
    this['exportType'] = $scope['exportType'] || FilterActionExportType.ACTIVE;

    /**
     * Filename for the exported file.
     * @type {string}
     */
    this['fileName'] = $scope['fileName'];

    /**
     * The error message to display on invalid export selection.
     * @type {string|undefined}
     */
    this['errorMsg'] = undefined;

    $scope.$emit(WindowEventType.READY);
    $scope.$on('$destroy', this.dispose.bind(this));

    this.validate();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

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
   * Validate the export selection.
   *
   * @export
   */
  validate() {
    this['errorMsg'] = undefined;

    switch (this['exportType']) {
      case FilterActionExportType.ACTIVE:
        if (!this.scope['entries'].some(testFilterActionEnabled)) {
          this['errorMsg'] = 'No actions are currently active.';
        }
        break;
      case FilterActionExportType.ALL:
        if (this.scope['entries'].length == 0) {
          this['errorMsg'] = 'No actions are available to export.';
        }
        break;
      case FilterActionExportType.SELECTED:
        if (!this.scope['selected'] || this.scope['selected'].length == 0) {
          this['errorMsg'] = 'No actions are currently selected.';
        }
        break;
      default:
        break;
    }
  }

  /**
   * Fire the confirmation callback and close the window.
   *
   * @export
   */
  save() {
    var entries;
    switch (this['exportType']) {
      case FilterActionExportType.ACTIVE:
        entries = this.scope['entries'].filter(function(entry) {
          return entry.isEnabled();
        });
        break;
      case FilterActionExportType.ALL:
        entries = this.scope['entries'];
        break;
      case FilterActionExportType.SELECTED:
        entries = this.scope['selected'];
        break;
      default:
        break;
    }

    if (entries) {
      exportFilterActionEntries(this['fileName'] + '.xml', entries);
    }

    this.close_();
  }

  /**
   * Close the window.
   *
   * @private
   */
  close_() {
    close(this.element);
  }
}

/**
 * Launch a dialog prompting the user to choose how to export filter actions.
 *
 * @param {!Array<!FilterActionEntry>} entries The filter action entries.
 * @param {Array<!FilterActionEntry>=} opt_selected The selected filter action entries.
 * @param {string=} opt_fileName The export file name.
 * @param {string=} opt_exportType The FilterActionExportType.
 */
export const launchFilterActionExport = function(entries, opt_selected, opt_fileName, opt_exportType) {
  var scopeOptions = {
    'entries': entries,
    'selected': opt_selected,
    'fileName': opt_fileName,
    'exportType': opt_exportType
  };

  var iam = ImportActionManager.getInstance();
  var windowOptions = {
    'id': 'filteractionexport',
    'label': 'Export ' + iam.entryTitle + 's',
    'icon': 'fa fa-download',
    'x': 'center',
    'y': 'center',
    'width': '400',
    'height': 'auto',
    'modal': 'true',
    'show-close': 'true'
  };

  var template = '<filteractionexport></filteractionexport>';
  create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};

/**
 * Export the provided filter actions.
 *
 * @param {string} fileName The name of the exported file.
 * @param {!Array<!FilterActionEntry>} entries
 */
export const exportFilterActionEntries = function(fileName, entries) {
  if (entries.length > 0) {
    var iam = ImportActionManager.getInstance();
    var rootNode = createElementNS(iam.xmlGroup, 'http://www.bit-sys.com/state/v4');
    var entryEls = exportEntries(entries, false);
    if (entryEls) {
      for (var i = 0; i < entryEls.length; i++) {
        rootNode.appendChild(entryEls[i]);
      }
    }

    saveFile(fileName, serialize(rootNode), 'text/xml');
  } else {
    AlertManager.getInstance().sendAlert('No actions to export.', AlertEventSeverity.WARNING);
  }
};
