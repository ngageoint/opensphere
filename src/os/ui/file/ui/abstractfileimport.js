goog.module('os.ui.file.ui.AbstractFileImportCtrl');
goog.module.declareLegacyNamespace();

const log = goog.require('goog.log');
const dispatcher = goog.require('os.Dispatcher');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const DataManager = goog.require('os.data.DataManager');
const DescriptorEvent = goog.require('os.data.DescriptorEvent');
const DescriptorEventType = goog.require('os.data.DescriptorEventType');
const {getLocalUrl, isLocal} = goog.require('os.file');
const FileStorage = goog.require('os.file.FileStorage');
const WindowEventType = goog.require('os.ui.WindowEventType');
const osWindow = goog.require('os.ui.window');


/**
 * Abstract controller for a file import UI.
 *
 * @abstract
 * @template CONFIG,DESCRIPTOR
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
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
     * @type {log.Logger}
     * @protected
     */
    this.log = logger;

    $scope.$watch('config.title', this.onTitleChange.bind(this));
    $scope.$on('$destroy', this.destroy.bind(this));

    $scope.$emit(WindowEventType.READY);
  }

  /**
   * Clean up.
   *
   * @protected
   */
  destroy() {
    this.config = null;
    this.scope = null;
    this.element = null;
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
   * Handles changes to the title field, checking if the title already exists.
   *
   * @param {string} newVal The new title value
   * @protected
   */
  onTitleChange(newVal) {
    if (newVal && newVal != this.originalTitle) {
      var exists = FileStorage.getInstance().fileExists(getLocalUrl(newVal));
      this.scope[this.formName]['title'].$setValidity('exists', !exists);
    } else {
      this.scope[this.formName]['title'].$setValidity('exists', true);
    }
  }

  /**
   * Create a descriptor for the import.
   *
   * @abstract
   * @return {DESCRIPTOR}
   * @protected
   */
  createDescriptor() {}

  /**
   * Create import command and close the window
   *
   * @export
   */
  accept() {
    var descriptor = this.createDescriptor();
    var url = this.config['file'].getUrl();
    if (url && isLocal(url)) {
      // local file, so store it before finishing the import
      this.storeLocal(descriptor);
    } else {
      // remote file, so just finish the import
      this.finishImport(descriptor);
    }

    osWindow.close(this.element);
  }

  /**
   * Cancel file import
   *
   * @export
   */
  cancel() {
    this.cleanConfig();
    osWindow.close(this.element);
  }

  /**
   * Store the local file being imported.
   *
   * @param {DESCRIPTOR} descriptor
   * @protected
   */
  storeLocal(descriptor) {
    // store with replace enabled in case the file already exists
    FileStorage.getInstance().storeFile(this.config['file'], true)
        .addCallbacks(goog.partial(this.finishImport, descriptor), this.onPersistError_, this);
  }

  /**
   * Get the provider for the file.
   *
   * @return {os.ui.data.DescriptorProvider}
   */
  getProvider() {
    return null;
  }

  /**
   * Import complete, so add the descriptor to the data manager and provider.
   *
   * @param {DESCRIPTOR} descriptor
   * @protected
   */
  finishImport(descriptor) {
    // add the descriptor to the data manager first
    DataManager.getInstance().addDescriptor(descriptor);

    // followed by the provider
    var provider = this.getProvider();
    if (provider) {
      provider.addDescriptor(descriptor);
    }

    this.cleanConfig();

    if (descriptor.isActive()) {
      dispatcher.getInstance().dispatchEvent(new DescriptorEvent(
          DescriptorEventType.USER_TOGGLED, descriptor));
    }
  }

  /**
   * @param {goog.db.Error} error
   * @private
   */
  onPersistError_(error) {
    var msg = 'Failed storing local file! Unable to finish import.';
    AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);
    this.cleanConfig();
  }
}

/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('os.ui.file.ui.AbstractFileImportCtrl');

exports = Controller;
