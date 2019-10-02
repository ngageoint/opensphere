goog.provide('plugin.file.zip.ui.ZIPImportCtrl');
goog.provide('plugin.file.zip.ui.zipImportDirective');

goog.require('os.defines');
goog.require('os.file.File');
goog.require('os.ui.Module');
goog.require('os.ui.im.FileImportWizard');
goog.require('os.ui.im.ImportProcess');
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
   * @type {boolean}
   * @private
   */
  this.semaphore_ = false;

  /**
   * @type {number}
   * @private
   */
  this.threads_ = 0;

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
  console.log('Woot!', this);
  plugin.file.zip.ui.ZIPImportCtrl.base(this, 'finish');
};


/**
 * @param {!plugin.file.zip.ZIPDescriptor} descriptor
 * @protected
 * @override
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.finishImport = function(descriptor) {
  console.log('final-woot!', this);
  var entries = this.config['files'];

  if (this.threads_ > 0) this.threads_--;

  if (!entries) {
    // TODO warn
    return;
  } else if (this.semaphore_ || this.threads_ > 0) {
    return; // another parallel callback will handle this
  }

  this.importers_ = [];

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (entry.selected === true) {
      var file = entry.file;
      var type = file.getType();
      var ui = this.im_.getImportUI(type);
      if (ui) this.importers_.push({ui: ui, file: file});
    }
  }

  if (this.importers_.length > 0) this.importer(); 

  plugin.file.zip.ui.ZIPImportCtrl.base(this, 'finishImport', descriptor);
};


/**
 * 
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.importer = function() {
  if (typeof this.importers_ == 'undefined' || this.importers_ == null || this.importers_.length == 0) return;

  var im = this.importers_.splice(0,1)[0]; //remove the current importer from the queue
  var process = new os.ui.im.ImportProcess();

  process.setEvent({file: im.file, config: this.config});

  //initialize and chain next import on callback
  process.begin().addCallbacks(
    this.importer,
    this.importer, // function() { console.log('ERROR!', arguments)},
    this
  );

  //execute
  //process.importFile();
};


/**
 * @param {!plugin.file.zip.ZIPDescriptor} descriptor
 * @protected
 * @override
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.storeAndFinish = function(descriptor) {
  console.log('double-woot!', this);
  var entries = this.config['files'];

  if (!entries) {
    // TODO warn
    return;
  }

  this.semaphore_ = true; // block multiple calls to finishImport() from conflicting

  var waiting = false;

  /*
  //store the unzipped files
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (entry.selected === true) {
      this.threads_++;
      waiting = true;

      var file = entry.file;
      this.fs
          .storeFile(file, true)
          .addCallbacks(goog.partial(this.finishImport, descriptor), this.onPersistError, this);
    }
  }
  */
  this.semaphore_ = false; // unblock

  if (!waiting) plugin.file.zip.ui.ZIPImportCtrl.base(this, 'storeAndFinish', descriptor);
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

/**
 * @inheritDoc
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.onPersistError = function(error) {
  if (this.threads_ > 0) this.threads_--;
  plugin.file.zip.ui.ZIPImportCtrl.base(this, 'onPersistError', error);
};
