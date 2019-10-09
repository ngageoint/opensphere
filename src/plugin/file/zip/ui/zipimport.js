goog.provide('plugin.file.zip.ui.ZIPImportCtrl');
goog.provide('plugin.file.zip.ui.zipImportDirective');

goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.defines');
goog.require('os.file.File');
goog.require('os.ui.Module');
goog.require('os.ui.im.DuplicateImportProcess');
goog.require('os.ui.im.FileImportWizard');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.im.ImportEventType');
goog.require('os.ui.im.ImportManager');
goog.require('os.ui.wiz.wizardDirective');
goog.require('plugin.file.zip.ZIPDescriptor');
goog.require('plugin.file.zip.ZIPProvider');


/**
 * The ZIP import directive; use the Wizard Directive
 *
 * @return {angular.Directive}
 */
plugin.file.zip.ui.zipImportDirective = function() {
  var dir = os.ui.wiz.wizardDirective();
  dir.controller = plugin.file.zip.ui.ZIPImportCtrl;
  return dir;
};
os.ui.Module.directive('zipimport', [plugin.file.zip.ui.zipImportDirective]);


/**
 * Controller for the ZIP import dialog
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @param {!Object.<string, string>} $attrs
 * @extends {os.ui.im.FileImportWizard<!plugin.file.zip.ZIPParserConfig,!plugin.file.zip.ZIPDescriptor>}
 * @constructor
 * @ngInject
 */
plugin.file.zip.ui.ZIPImportCtrl = function($scope, $element, $timeout, $attrs) {
  plugin.file.zip.ui.ZIPImportCtrl.base(this, 'constructor', $scope, $element, $timeout, $attrs);

  /**
   * @type {os.ui.im.ImportManager}
   * @private
   */
  this.im_ = os.ui.im.ImportManager.getInstance();

  /**
   * @type {!Array<Object>}
   * @private
   */
  this.importers_;
};
goog.inherits(plugin.file.zip.ui.ZIPImportCtrl, os.ui.im.FileImportWizard);


/**
 * @param {!plugin.file.zip.ZIPDescriptor} descriptor
 * @protected
 * @override
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.addDescriptorToProvider = function(descriptor) {
  plugin.file.zip.ZIPProvider.getInstance().addDescriptor(descriptor);
};


/**
 * @param {!plugin.file.zip.ZIPParserConfig} config
 * @return {!plugin.file.zip.ZIPDescriptor}
 * @protected
 * @override
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.createFromConfig = function(config) {
  return plugin.file.zip.ZIPDescriptor.createFromConfig(this.config);
};


/**
 * @inheritDoc
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.finish = function() {
  var entries = this.config['files'];

  if (!entries) {
    var msg = 'No files selected to import from ZIP';
    os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.WARNING);
    return;
  }

  this.importers_ = [];
  var unsupported = {};

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (entry.selected === true) {
      var file = entry.file;
      var type = file.getType();
      var ui = this.im_.getImportUI(type);
      if (ui) this.importers_.push({ui: ui, file: file});
      else unsupported[type] = true; // store the filetype to report to user later
    }
  }

  var keys = Object.keys(unsupported);

  if (keys && keys.length > 0) {
    var err = 'Unsupported filetype(s).<br />' + keys.join(', ');
    os.alert.AlertManager.getInstance().sendAlert(err, os.alert.AlertEventSeverity.ERROR);
  }

  plugin.file.zip.ui.ZIPImportCtrl.base(this, 'finish');
};


/**
 * @param {!plugin.file.zip.ZIPDescriptor} descriptor
 * @protected
 * @override
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.finishImport = function(descriptor) {
  if (this.importers_ && this.importers_.length > 0) this.chain();

  plugin.file.zip.ui.ZIPImportCtrl.base(this, 'finishImport', descriptor);
};

/**
 * @inheritDoc
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.storeAndFinish = function(descriptor) {
  // do not store the ZIP file; just the file(s) that are subsequently imported
  this.finishImport(descriptor);
};


/**
 * Kick off the import of an unzipped file
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.chain = function() {
  if (typeof this.importers_ == 'undefined' || this.importers_ == null || this.importers_.length == 0) return;

  var im = this.importers_.splice(0, 1)[0]; // remove the current importer from the queue
  var process = new os.ui.im.DuplicateImportProcess();
  var event = new os.ui.im.ImportEvent(os.ui.im.ImportEventType.FILE, im.file);

  process.setEvent(event);

  // initialize and chain next import on callback
  process.begin().addCallbacks(
      this.chain,
      function() {
        // messaging should be handled by the Import Process... just kick off the next item in the chain
        this.chain();
      },
      this
  );
};


/**
 * @param {!plugin.file.zip.ZIPDescriptor} descriptor
 * @param {!plugin.file.zip.ZIPParserConfig} config
 * @protected
 * @override
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.updateFromConfig = function(descriptor, config) {
  descriptor.updateFromConfig(config);
};
