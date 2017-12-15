goog.provide('os.ui.im.action.FilterActionImportCtrl');
goog.provide('os.ui.im.action.filterActionImportDirective');

goog.require('os.command.SequenceCommand');
goog.require('os.filter.im.OSFilterImportCtrl');
goog.require('os.im.action.FilterActionEntry');
goog.require('os.im.action.FilterActionParser');
goog.require('os.im.action.cmd.FilterActionAdd');
goog.require('os.ui.Module');
goog.require('os.ui.filter');
goog.require('os.ui.filter.im.filterImportDirective');


/**
 * The filteractionimport directive.
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
 */
os.ui.im.action.FilterActionImportCtrl.prototype.getParser = function() {
  return new os.im.action.FilterActionParser();
};


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionImportCtrl.prototype.getFilterTooltip = function(entry) {
  var tooltip = 'Filter: ' + os.ui.filter.toFilterString(entry.getFilterNode(), 1000);

  if (entry instanceof os.im.action.FilterActionEntry && entry.actions.length > 0) {
    var actionText = entry.actions.map(function(action) {
      return action.getLabel();
    }).join(', ') || 'None';

    tooltip += '\nActions: ' + actionText;
  }

  return tooltip;
};


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionImportCtrl.prototype.finish = function() {
  var iam = os.im.action.ImportActionManager.getInstance();
  var entries = [];

  // add any enqueued matching filters that the user may have forgotten
  this.addNotFound();

  for (var key in this['found']) {
    var layerModel = this['found'][key];
    var filterModels = layerModel['filterModels'];
    for (var i = 0; i < filterModels.length; i++) {
      // add each filter and create a query entry for it
      var entry = /** @type {os.im.action.FilterActionEntry} */ (filterModels[i]['filter']);
      if (entry) {
        entries.push(entry);
      }
    }
  }

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

    msg = 'Successfully imported <b>' + entries.length + '</b> ' + entryTitle + '.';
    am.sendAlert(msg, os.alert.AlertEventSeverity.SUCCESS);
  } else {
    msg = 'No ' + iam.entryTitle + 's were imported!';
    am.sendAlert(msg, os.alert.AlertEventSeverity.WARNING);
  }

  os.ui.window.close(this.element);
};
goog.exportProperty(
    os.ui.im.action.FilterActionImportCtrl.prototype,
    'finish',
    os.ui.im.action.FilterActionImportCtrl.prototype.finish);


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionImportCtrl.prototype.getFilterIcon = function() {
  return os.im.action.ICON;
};
goog.exportProperty(
    os.ui.im.action.FilterActionImportCtrl.prototype,
    'getFilterIcon',
    os.ui.im.action.FilterActionImportCtrl.prototype.getFilterIcon);
