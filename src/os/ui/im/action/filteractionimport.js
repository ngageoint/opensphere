goog.declareModuleId('os.ui.im.action.FilterActionImport');

import {directive as filterImportDirective} from '../../filter/im/filterimport.js';
import Module from '../../module.js';
import {close} from '../../window.js';
import FilterActionImporter from './filteractionimporter.js';
import {getEntriesFromMatched} from './filteractionui.js';

const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const CommandProcessor = goog.require('os.command.CommandProcessor');
const SequenceCommand = goog.require('os.command.SequenceCommand');
const DataManager = goog.require('os.data.DataManager');
const IDataDescriptor = goog.require('os.data.IDataDescriptor');
const IFilterable = goog.require('os.filter.IFilterable');
const {Controller: OSFilterImportCtrl} = goog.require('os.filter.im.OSFilterImport');
const {ICON, getColumnsFromFilterable} = goog.require('os.im.action');
const FilterActionParser = goog.require('os.im.action.FilterActionParser');
const ImportActionManager = goog.require('os.im.action.ImportActionManager');
const FilterActionAdd = goog.require('os.im.action.cmd.FilterActionAdd');
const osImplements = goog.require('os.implements');
const DrawingLayer = goog.require('os.layer.Drawing');
const {getMapContainer} = goog.require('os.map.instance');

const ILayer = goog.requireType('os.layer.ILayer');


/**
 * The filteractionimport directive.
 *
 * @return {angular.Directive}
 */
export const directive = () => {
  var dir = filterImportDirective();
  dir.controller = Controller;
  return dir;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'filteractionimport';


/**
 * Add the directive to the module.
 */
Module.directive('filteractionimport', [directive]);



/**
 * Controller function for the filteractionimport directive.
 * @unrestricted
 */
export class Controller extends OSFilterImportCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @param {!angular.$sce} $sce Angular SCE service.
   * @ngInject
   */
  constructor($scope, $element, $sce) {
    super($scope, $element, $sce);
    this.filterTitle = ImportActionManager.getInstance().entryTitle;
    this['showMatch'] = false;
  }

  /**
   * @inheritDoc
   * @export
   */
  getFilterIcon() {
    return ICON;
  }

  /**
   * @inheritDoc
   */
  getImporter() {
    var layerId = /** @type {string|undefined} */ (this.scope['layerId']);
    return new FilterActionImporter(this.getParser(), layerId);
  }

  /**
   * @inheritDoc
   */
  getParser() {
    return new FilterActionParser();
  }

  /**
   * @inheritDoc
   */
  getFilterables() {
    var descriptors = DataManager.getInstance().getDescriptors();
    var layers = getMapContainer().getLayers();

    // filter down to only the IFilterable descriptors
    var filterables = descriptors.filter(function(d) {
      d = /** @type {IFilterable} */ (d);
      return osImplements(d, IFilterable.ID) && d.isFilterable();
    });

    if (layers) {
      layers.forEach(function(layer) {
        // we only want IFilterable layers, BUT... we want even ones that return false from isFilterable()
        // also, exclude the drawing layer
        if (osImplements(layer, IFilterable.ID) && /** @type {ILayer} */ (layer).getId() != DrawingLayer.ID) {
          layer = /** @type {IFilterable} */ (layer);
          filterables.unshift(layer);
        }
      });
    }

    return /** @type {!Array<!IFilterable>} */ (filterables);
  }

  /**
   * @inheritDoc
   */
  onLayerChange(layer) {
    this.columns = [];

    if (osImplements(layer, IDataDescriptor.ID)) {
      super.onLayerChange(layer);
      return;
    }

    if (osImplements(layer, IFilterable.ID)) {
      var filterable = /** @type {IFilterable} */ (layer);

      this.columns = getColumnsFromFilterable(filterable);
    }

    this.testColumns();
  }

  /**
   * @inheritDoc
   * @export
   */
  finish() {
    var iam = ImportActionManager.getInstance();
    var entries = getEntriesFromMatched(this['matched']);

    var msg;
    var am = AlertManager.getInstance();
    if (entries.length > 0) {
      var plural = entries.length == 1 ? '' : 's';
      var entryTitle = iam.entryTitle + plural;

      var cmd;
      var cmds = entries.map(function(entry) {
        return new FilterActionAdd(entry);
      });

      if (cmds.length > 1) {
        cmd = new SequenceCommand();
        cmd.setCommands(cmds);
        cmd.title = 'Import ' + entries.length + ' ' + entryTitle;
      } else {
        cmd = cmds[0];
      }

      CommandProcessor.getInstance().addCommand(cmd);

      msg = 'Successfully imported <b>' + this['matchedCount'] + '</b> ' + entryTitle + '.';
      am.sendAlert(msg, AlertEventSeverity.SUCCESS);
    } else {
      msg = 'No ' + iam.entryTitle + 's were imported!';
      am.sendAlert(msg, AlertEventSeverity.WARNING);
    }

    close(this.element);
  }
}
