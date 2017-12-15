goog.provide('os.ui.im.FileImportWizard');
goog.require('os.data.DataManager');
goog.require('os.file.FileStorage');
goog.require('os.ui.Module');
goog.require('os.ui.wiz.WizardCtrl');
goog.require('os.ui.wiz.wizardDirective');



/**
 * Generic controller for a file import wizard window
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @param {!Object.<string, string>} $attrs
 * @extends {os.ui.wiz.WizardCtrl.<T>}
 * @constructor
 * @ngInject
 * @template T,S
 */
os.ui.im.FileImportWizard = function($scope, $element, $timeout, $attrs) {
  os.ui.im.FileImportWizard.base(this, 'constructor', $scope, $element, $timeout, $attrs);

  /**
   * @type {os.file.FileStorage}
   * @protected
   */
  this.fs = os.file.FileStorage.getInstance();
};
goog.inherits(os.ui.im.FileImportWizard, os.ui.wiz.WizardCtrl);


/**
 * @inheritDoc
 */
os.ui.im.FileImportWizard.prototype.cancelInternal = function() {
  this.cleanConfig();
  os.ui.im.FileImportWizard.base(this, 'cancelInternal');
};


/**
 * Clean up the parser configuration, removing any references it doesn't need.
 * @protected
 */
os.ui.im.FileImportWizard.prototype.cleanConfig = function() {
  if (this.config) {
    this.config['file'] = null;
    this.config['descriptor'] = null;
  }
};


/**
 * @inheritDoc
 */
os.ui.im.FileImportWizard.prototype.finish = function() {
  var descriptor = null;
  if (this.config['descriptor']) {
    // existing descriptor. deactivate the descriptor, then update it
    descriptor = this.config['descriptor'];
    descriptor.setActive(false);
    this.updateFromConfig(descriptor, this.config);
  } else {
    // this is a new import
    descriptor = this.createFromConfig(this.config);
  }

  this.storeAndFinish(descriptor);
  os.ui.im.FileImportWizard.base(this, 'finish');
};


/**
 * Identify files that need to be stored and finish the import.
 * @param {!S} descriptor
 * @protected
 */
os.ui.im.FileImportWizard.prototype.storeAndFinish = function(descriptor) {
  var url = this.config['file'].getUrl();
  if (url && os.file.isLocal(url)) {
    // local file, so store it before finishing the import
    // store with replace enabled in case the file already exists
    this.fs.storeFile(this.config['file'], true)
        .addCallbacks(goog.partial(this.finishImport, descriptor), this.onPersistError, this);
  } else {
    // remote file, so just finish the import
    this.finishImport(descriptor);
  }
};


/**
 * Import complete, so add the descriptor to the data manager and provider.
 * @param {!S} descriptor
 * @protected
 */
os.ui.im.FileImportWizard.prototype.finishImport = function(descriptor) {
  // add the descriptor to the data manager first
  os.dataManager.addDescriptor(descriptor);

  // followed by the provider
  this.addDescriptorToProvider(descriptor);

  this.cleanConfig();
};


/**
 * @param {goog.db.Error} error
 * @protected
 */
os.ui.im.FileImportWizard.prototype.onPersistError = function(error) {
  var msg = 'Failed storing local file! Unable to finish import.';
  os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.ERROR);

  this.cleanConfig();
};


/**
 * @param {!S} descriptor
 * @protected
 */
os.ui.im.FileImportWizard.prototype.addDescriptorToProvider = goog.abstractMethod;


/**
 * @param {!T} config
 * @return {!S}
 * @protected
 */
os.ui.im.FileImportWizard.prototype.createFromConfig = goog.abstractMethod;


/**
 * @param {!S} descriptor
 * @param {!T} config
 * @protected
 */
os.ui.im.FileImportWizard.prototype.updateFromConfig = goog.abstractMethod;
