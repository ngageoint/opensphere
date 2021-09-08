goog.module('os.ui.im.FileImportWizard');

const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const DataManager = goog.require('os.data.DataManager');
const {isLocal} = goog.require('os.file');
const FileStorage = goog.require('os.file.FileStorage');
const {Controller: WizardController} = goog.require('os.ui.wiz.WizardUI');

const DBError = goog.requireType('goog.db.Error');


/**
 * Generic controller for a file import wizard window
 *
 * @abstract
 * @extends {WizardController<T>}
 * @template T,S
 * @unrestricted
 */
class Controller extends WizardController {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @param {!Object.<string, string>} $attrs
   * @ngInject
   */
  constructor($scope, $element, $timeout, $attrs) {
    super($scope, $element, $timeout, $attrs);

    /**
     * @type {FileStorage}
     * @protected
     */
    this.fs = FileStorage.getInstance();
  }

  /**
   * @inheritDoc
   */
  cancelInternal() {
    this.cleanConfig();
    super.cancelInternal();
  }

  /**
   * Clean up the parser configuration, removing any references it doesn't need.
   *
   * @protected
   */
  cleanConfig() {
    if (this.config) {
      this.config['file'] = null;
      this.config['descriptor'] = null;
    }
  }

  /**
   * @inheritDoc
   */
  finish() {
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
    super.finish();
  }

  /**
   * Identify files that need to be stored and finish the import.
   *
   * @param {!S} descriptor
   * @protected
   */
  storeAndFinish(descriptor) {
    var url = this.config['file'].getUrl();
    if (url && isLocal(url)) {
      // local file, so store it before finishing the import
      // store with replace enabled in case the file already exists
      this.fs.storeFile(this.config['file'], true)
          .addCallbacks(goog.partial(this.finishImport, descriptor), this.onPersistError, this);
    } else {
      // remote file, so just finish the import
      this.finishImport(descriptor);
    }
  }

  /**
   * Import complete, so add the descriptor to the data manager and provider.
   *
   * @param {!S} descriptor
   * @protected
   */
  finishImport(descriptor) {
    // add the descriptor to the data manager first
    DataManager.getInstance().addDescriptor(descriptor);

    // followed by the provider
    this.addDescriptorToProvider(descriptor);

    this.cleanConfig();
  }

  /**
   * @param {DBError} error
   * @protected
   */
  onPersistError(error) {
    var msg = 'Failed storing local file! Unable to finish import.';
    AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);

    this.cleanConfig();
  }

  /**
   * @abstract
   * @param {!S} descriptor
   * @protected
   */
  addDescriptorToProvider(descriptor) {}

  /**
   * @abstract
   * @param {!T} config
   * @return {!S}
   * @protected
   */
  createFromConfig(config) {}

  /**
   * @abstract
   * @param {!S} descriptor
   * @param {!T} config
   * @protected
   */
  updateFromConfig(descriptor, config) {}
}

exports = Controller;
