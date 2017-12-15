goog.provide('os.ui.im.action.FilterActionExportCtrl');
goog.provide('os.ui.im.action.FilterActionExportType');
goog.provide('os.ui.im.action.filterActionExportDirective');

goog.require('goog.Disposable');
goog.require('os.file.persist.FilePersistence');
goog.require('os.im.action.filter');
goog.require('os.ui.Module');
goog.require('os.ui.filter');


/**
 * @enum {string}
 */
os.ui.im.action.FilterActionExportType = {
  ACTIVE: 'active',
  SELECTED: 'selected',
  ALL: 'all'
};


/**
 * The filteractionexport directive.
 * @return {angular.Directive}
 */
os.ui.im.action.filterActionExportDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/im/action/filteractionexport.html',
    controller: os.ui.im.action.FilterActionExportCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('filteractionexport', [os.ui.im.action.filterActionExportDirective]);



/**
 * Controller function for the filteractionexport directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.im.action.FilterActionExportCtrl = function($scope, $element) {
  os.ui.im.action.FilterActionExportCtrl.base(this, 'constructor');

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
  this['exportType'] = $scope['exportType'] || os.ui.im.action.FilterActionExportType.ACTIVE;

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

  $scope.$emit(os.ui.WindowEventType.READY);
  $scope.$on('$destroy', this.dispose.bind(this));

  this.validate();
};
goog.inherits(os.ui.im.action.FilterActionExportCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionExportCtrl.prototype.disposeInternal = function() {
  os.ui.im.action.FilterActionExportCtrl.base(this, 'disposeInternal');

  this.scope = null;
  this.element = null;
};


/**
 * Fire the cancel callback and close the window.
 */
os.ui.im.action.FilterActionExportCtrl.prototype.cancel = function() {
  this.close_();
};
goog.exportProperty(
    os.ui.im.action.FilterActionExportCtrl.prototype,
    'cancel',
    os.ui.im.action.FilterActionExportCtrl.prototype.cancel);


/**
 * Validate the export selection.
 */
os.ui.im.action.FilterActionExportCtrl.prototype.validate = function() {
  this['errorMsg'] = undefined;

  switch (this['exportType']) {
    case os.ui.im.action.FilterActionExportType.ACTIVE:
      if (!this.scope['entries'].some(os.im.action.testFilterActionEnabled)) {
        this['errorMsg'] = 'No actions are currently active.';
      }
      break;
    case os.ui.im.action.FilterActionExportType.ALL:
      if (this.scope['entries'].length == 0) {
        this['errorMsg'] = 'No actions are available to export.';
      }
      break;
    case os.ui.im.action.FilterActionExportType.SELECTED:
      if (!this.scope['selected'] || this.scope['selected'].length == 0) {
        this['errorMsg'] = 'No actions are currently selected.';
      }
      break;
    default:
      break;
  }
};
goog.exportProperty(
    os.ui.im.action.FilterActionExportCtrl.prototype,
    'validate',
    os.ui.im.action.FilterActionExportCtrl.prototype.validate);


/**
 * Fire the confirmation callback and close the window.
 */
os.ui.im.action.FilterActionExportCtrl.prototype.save = function() {
  var entries;
  switch (this['exportType']) {
    case os.ui.im.action.FilterActionExportType.ACTIVE:
      entries = this.scope['entries'].filter(function(entry) {
        return entry.isEnabled();
      });
      break;
    case os.ui.im.action.FilterActionExportType.ALL:
      entries = this.scope['entries'];
      break;
    case os.ui.im.action.FilterActionExportType.SELECTED:
      entries = this.scope['selected'];
      break;
    default:
      break;
  }

  if (entries) {
    os.ui.im.action.export(this['fileName'] + '.xml', entries);
  }

  this.close_();
};
goog.exportProperty(
    os.ui.im.action.FilterActionExportCtrl.prototype,
    'save',
    os.ui.im.action.FilterActionExportCtrl.prototype.save);


/**
 * Close the window.
 * @private
 */
os.ui.im.action.FilterActionExportCtrl.prototype.close_ = function() {
  os.ui.window.close(this.element);
};


/**
 * Launch a dialog prompting the user to choose how to export filter actions.
 * @param {!Array<!os.im.action.FilterActionEntry>} entries The filter action entries.
 * @param {Array<!os.im.action.FilterActionEntry>=} opt_selected The selected filter action entries.
 * @param {string=} opt_fileName The export file name.
 */
os.ui.im.action.launchFilterActionExport = function(entries, opt_selected, opt_fileName) {
  var scopeOptions = {
    'entries': entries,
    'selected': opt_selected,
    'fileName': opt_fileName
  };

  var iam = os.im.action.ImportActionManager.getInstance();
  var windowOptions = {
    'id': 'filteractionexport',
    'label': 'Export ' + iam.entryTitle + 's',
    'icon': 'fa fa-download',
    'x': 'center',
    'y': 'center',
    'width': '260',
    'height': 'auto',
    'modal': 'true',
    'show-close': 'true'
  };

  var template = '<filteractionexport></filteractionexport>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};


/**
 * Export the provided filter actions.
 * @param {string} fileName The name of the exported file.
 * @param {!Array<!os.im.action.FilterActionEntry>} entries
 */
os.ui.im.action.export = function(fileName, entries) {
  if (entries.length > 0) {
    var iam = os.im.action.ImportActionManager.getInstance();
    var rootNode = os.xml.createElementNS(iam.xmlGroup, 'http://www.bit-sys.com/state/v4');
    var entryEls = os.im.action.filter.exportEntries(entries, false);
    if (entryEls) {
      for (var i = 0; i < entryEls.length; i++) {
        rootNode.appendChild(entryEls[i]);
      }
    }

    os.file.persist.saveFile(fileName, os.xml.serialize(rootNode), 'text/xml');
  } else {
    os.alertManager.sendAlert('No actions to export.', os.alert.AlertEventSeverity.WARNING);
  }
};
