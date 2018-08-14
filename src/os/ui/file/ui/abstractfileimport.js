goog.provide('os.ui.file.ui.AbstractFileImportCtrl');

goog.require('goog.log');
goog.require('os.data.DescriptorEvent');
goog.require('os.data.DescriptorEventType');
goog.require('os.file.FileStorage');
goog.require('os.ui.window');



/**
 * Abstract controller for a file import UI.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 * @template CONFIG,DESCRIPTOR
 */
os.ui.file.ui.AbstractFileImportCtrl = function($scope, $element) {
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
   * @type {CONFIG}
   * @protected
   */
  this.config = $scope['config'];

  /**
   * @type {string}
   * @protected
   */
  this.originalTitle = $scope['config']['title'];

  /**
   * The name of the form in the template
   * @type {string}
   * @protected
   */
  this.formName = 'importForm';

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.ui.file.ui.AbstractFileImportCtrl.LOGGER_;

  $scope.$watch('config.title', this.onTitleChange.bind(this));
  $scope.$on('$destroy', this.destroy.bind(this));

  $scope.$emit(os.ui.WindowEventType.READY);
};


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.file.ui.AbstractFileImportCtrl.LOGGER_ = goog.log.getLogger('os.ui.file.ui.AbstractFileImportCtrl');


/**
 * Clean up.
 * @protected
 */
os.ui.file.ui.AbstractFileImportCtrl.prototype.destroy = function() {
  this.config = null;
  this.scope = null;
  this.element = null;
};


/**
 * Clean up the parser configuration, removing any references it doesn't need.
 * @protected
 */
os.ui.file.ui.AbstractFileImportCtrl.prototype.cleanConfig = function() {
  if (this.config) {
    this.config['file'] = null;
    this.config['descriptor'] = null;
  }
};


/**
 * Handles changes to the title field, checking if the title already exists.
 * @param {string} newVal The new title value
 * @protected
 */
os.ui.file.ui.AbstractFileImportCtrl.prototype.onTitleChange = function(newVal) {
  if (newVal && newVal != this.originalTitle) {
    var exists = os.file.FileStorage.getInstance().fileExists(os.file.getLocalUrl(newVal));
    this.scope[this.formName]['title'].$setValidity('exists', !exists);
  } else {
    this.scope[this.formName]['title'].$setValidity('exists', true);
  }
};


/**
 * Create a descriptor for the import.
 * @return {DESCRIPTOR}
 * @protected
 */
os.ui.file.ui.AbstractFileImportCtrl.prototype.createDescriptor = goog.abstractMethod;


/**
 * Create import command and close the window
 */
os.ui.file.ui.AbstractFileImportCtrl.prototype.accept = function() {
  var descriptor = this.createDescriptor();
  var url = this.config['file'].getUrl();
  if (url && os.file.isLocal(url)) {
    // local file, so store it before finishing the import
    this.storeLocal(descriptor);
  } else {
    // remote file, so just finish the import
    this.finishImport(descriptor);
  }

  os.ui.window.close(this.element);
};
goog.exportProperty(os.ui.file.ui.AbstractFileImportCtrl.prototype, 'accept',
    os.ui.file.ui.AbstractFileImportCtrl.prototype.accept);


/**
 * Cancel file import
 */
os.ui.file.ui.AbstractFileImportCtrl.prototype.cancel = function() {
  this.cleanConfig();
  os.ui.window.close(this.element);
};
goog.exportProperty(os.ui.file.ui.AbstractFileImportCtrl.prototype, 'cancel',
    os.ui.file.ui.AbstractFileImportCtrl.prototype.cancel);


/**
 * Store the local file being imported.
 * @param {DESCRIPTOR} descriptor
 * @protected
 */
os.ui.file.ui.AbstractFileImportCtrl.prototype.storeLocal = function(descriptor) {
  // store with replace enabled in case the file already exists
  os.file.FileStorage.getInstance().storeFile(this.config['file'], true)
      .addCallbacks(goog.partial(this.finishImport, descriptor), this.onPersistError_, this);
};


/**
 * Get the provider for the file.
 * @return {os.ui.data.DescriptorProvider}
 */
os.ui.file.ui.AbstractFileImportCtrl.prototype.getProvider = function() {
  return null;
};


/**
 * Import complete, so add the descriptor to the data manager and provider.
 * @param {DESCRIPTOR} descriptor
 * @protected
 */
os.ui.file.ui.AbstractFileImportCtrl.prototype.finishImport = function(descriptor) {
  // add the descriptor to the data manager first
  os.dataManager.addDescriptor(descriptor);

  // followed by the provider
  var provider = this.getProvider();
  if (provider) {
    provider.addDescriptor(descriptor);
  }

  this.cleanConfig();

  if (descriptor.isActive()) {
    os.dispatcher.dispatchEvent(new os.data.DescriptorEvent(
        os.data.DescriptorEventType.USER_TOGGLED, descriptor));
  }
};


/**
 * @param {goog.db.Error} error
 * @private
 */
os.ui.file.ui.AbstractFileImportCtrl.prototype.onPersistError_ = function(error) {
  var msg = 'Failed storing local file! Unable to finish import.';
  os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
  this.cleanConfig();
};
