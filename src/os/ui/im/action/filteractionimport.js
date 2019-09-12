goog.provide('os.ui.im.action.FilterActionImportCtrl');
goog.provide('os.ui.im.action.filterActionImportDirective');

goog.require('os.command.SequenceCommand');
goog.require('os.filter.im.OSFilterImportCtrl');
goog.require('os.im.action.FilterActionEntry');
goog.require('os.im.action.FilterActionParser');
goog.require('os.im.action.cmd.FilterActionAdd');
goog.require('os.layer.Drawing');
goog.require('os.ui.Module');
goog.require('os.ui.filter');
goog.require('os.ui.filter.im.filterImportDirective');
goog.require('os.ui.im.action.FilterActionImporter');


/**
 * The filteractionimport directive.
 *
 * @return {angular.Directive}
 */
os.ui.im.action.filterActionImportDirective = function() {
  var dir = os.ui.filter.im.filterImportDirective();
  dir.controller = os.ui.im.action.FilterActionImportCtrl;
  return dir;
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('filteractionimport', [os.ui.im.action.filterActionImportDirective]);



/**
 * Controller function for the filteractionimport directive.
 *
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @param {!angular.$sce} $sce Angular SCE service.
 * @extends {os.filter.im.OSFilterImportCtrl}
 * @constructor
 * @ngInject
 */
os.ui.im.action.FilterActionImportCtrl = function($scope, $element, $sce) {
  os.ui.im.action.FilterActionImportCtrl.base(this, 'constructor', $scope, $element, $sce);
  this.filterTitle = os.im.action.ImportActionManager.getInstance().entryTitle;
  this['showMatch'] = false;
};
goog.inherits(os.ui.im.action.FilterActionImportCtrl, os.filter.im.OSFilterImportCtrl);


/**
 * @inheritDoc
 * @export
 */
os.ui.im.action.FilterActionImportCtrl.prototype.getFilterIcon = function() {
  return os.im.action.ICON;
};


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionImportCtrl.prototype.getImporter = function() {
  var layerId = /** @type {string|undefined} */ (this.scope['layerId']);
  return new os.ui.im.action.FilterActionImporter(this.getParser(), layerId);
};


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionImportCtrl.prototype.getParser = function() {
  return new os.im.action.FilterActionParser();
};


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionImportCtrl.prototype.getFilterables = function() {
  var descriptors = os.dataManager.getDescriptors();
  var layers = os.map.mapContainer.getLayers();

  // filter down to only the IFilterable descriptors
  var filterables = descriptors.filter(function(d) {
    d = /** @type {os.filter.IFilterable} */ (d);
    return os.implements(d, os.filter.IFilterable.ID) && d.isFilterable();
  });

  if (layers) {
    layers.forEach(function(layer) {
      // we only want IFilterable layers, BUT... we want even ones that return false from isFilterable()
      // also, exclude the drawing layer
      if (os.implements(layer, os.filter.IFilterable.ID) && layer.getId() != os.layer.Drawing.ID) {
        layer = /** @type {os.filter.IFilterable} */ (layer);
        filterables.unshift(layer);
      }
    });
  }

  return /** @type {!Array<!os.filter.IFilterable>} */ (filterables);
};


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionImportCtrl.prototype.onLayerChange = function(layer) {
  this.columns = [];

  if (os.implements(layer, os.data.IDataDescriptor.ID)) {
    os.ui.im.action.FilterActionImportCtrl.base(this, 'onLayerChange', layer);
    return;
  }

  if (os.implements(layer, os.filter.IFilterable.ID)) {
    var filterable = /** @type {os.filter.IFilterable} */ (layer);

    if (layer instanceof os.layer.Vector) {
      // its a layer but for filter actions, we want to get the columns a little differently
      var source = /** @type {os.source.ISource} */ (layer.getSource());
      var columns = os.source.getFilterColumns(source, true, true);
      this.columns = columns.map(os.source.definitionsToFeatureTypes);
    } else {
      // it's another filterable descriptor, so just get its columns
      this.columns = filterable.getFilterColumns();
    }
  }

  this.testColumns();
};


/**
 * @inheritDoc
 * @export
 */
os.ui.im.action.FilterActionImportCtrl.prototype.finish = function() {
  var iam = os.im.action.ImportActionManager.getInstance();
  var entries = os.ui.im.action.getEntriesFromMatched(this['matched']);

  var msg;
  var am = os.alert.AlertManager.getInstance();
  if (entries.length > 0) {
    var plural = entries.length == 1 ? '' : 's';
    var entryTitle = iam.entryTitle + plural;

    var cmd;
    var cmds = entries.map(function(entry) {
      return new os.im.action.cmd.FilterActionAdd(entry);
    });

    if (cmds.length > 1) {
      cmd = new os.command.SequenceCommand();
      cmd.setCommands(cmds);
      cmd.title = 'Import ' + entries.length + ' ' + entryTitle;
    } else {
      cmd = cmds[0];
    }

    os.commandStack.addCommand(cmd);

    msg = 'Successfully imported <b>' + this['matchedCount'] + '</b> ' + entryTitle + '.';
    am.sendAlert(msg, os.alert.AlertEventSeverity.SUCCESS);
  } else {
    msg = 'No ' + iam.entryTitle + 's were imported!';
    am.sendAlert(msg, os.alert.AlertEventSeverity.WARNING);
  }

  os.ui.window.close(this.element);
};
