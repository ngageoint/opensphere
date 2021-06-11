goog.module('os.ui.im.action.FilterActionImport');
goog.module.declareLegacyNamespace();

const CommandProcessor = goog.require('os.command.CommandProcessor');
const SequenceCommand = goog.require('os.command.SequenceCommand');
const DataManager = goog.require('os.data.DataManager');
const IFilterable = goog.require('os.filter.IFilterable');
const OSFilterImportCtrl = goog.require('os.filter.im.OSFilterImportCtrl');
const FilterActionParser = goog.require('os.im.action.FilterActionParser');
const ImportActionManager = goog.require('os.im.action.ImportActionManager');
const FilterActionAdd = goog.require('os.im.action.cmd.FilterActionAdd');
const DrawingLayer = goog.require('os.layer.Drawing');
const {getMapContainer} = goog.require('os.map.instance');
const Module = goog.require('os.ui.Module');
const filterImportDirective = goog.require('os.ui.filter.im.filterImportDirective');
const {getEntriesFromMatched} = goog.require('os.ui.im.action');
const FilterActionImporter = goog.require('os.ui.im.action.FilterActionImporter');

const ILayer = goog.requireType('os.layer.ILayer');


/**
 * The filteractionimport directive.
 *
 * @return {angular.Directive}
 */
const directive = () => {
  var dir = filterImportDirective();
  dir.controller = Controller;
  return dir;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'filteractionimport';


/**
 * Add the directive to the module.
 */
Module.directive('filteractionimport', [directive]);



/**
 * Controller function for the filteractionimport directive.
 * @unrestricted
 */
class Controller extends OSFilterImportCtrl {
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
    return os.im.action.ICON;
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
      return os.implements(d, IFilterable.ID) && d.isFilterable();
    });

    if (layers) {
      layers.forEach(function(layer) {
        // we only want IFilterable layers, BUT... we want even ones that return false from isFilterable()
        // also, exclude the drawing layer
        if (os.implements(layer, IFilterable.ID) && /** @type {ILayer} */ (layer).getId() != DrawingLayer.ID) {
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

    if (os.implements(layer, os.data.IDataDescriptor.ID)) {
      super.onLayerChange(layer);
      return;
    }

    if (os.implements(layer, IFilterable.ID)) {
      var filterable = /** @type {IFilterable} */ (layer);

      this.columns = os.im.action.getColumnsFromFilterable(filterable);
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
    var am = os.alert.AlertManager.getInstance();
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
      am.sendAlert(msg, os.alert.AlertEventSeverity.SUCCESS);
    } else {
      msg = 'No ' + iam.entryTitle + 's were imported!';
      am.sendAlert(msg, os.alert.AlertEventSeverity.WARNING);
    }

    os.ui.window.close(this.element);
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
