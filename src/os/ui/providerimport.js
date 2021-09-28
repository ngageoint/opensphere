goog.declareModuleId('os.ui.ProviderImportCtrl');

import Settings from '../config/settings.js';
import {ProviderKey} from '../data/data.js';
import DataManager from '../data/datamanager.js';
import {close, create, exists, getById} from './window.js';
import WindowEventType from './windoweventtype.js';

const GoogEventType = goog.require('goog.events.EventType');
const {getRandomString} = goog.require('goog.string');

const {default: IDataProvider} = goog.requireType('os.data.IDataProvider');


/**
 * Controller for the provider import UI
 *
 * @abstract
 * @unrestricted
 */
export default class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    $scope['error'] = '';

    /**
     * @type {!angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * @type {!angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * @type {?IDataProvider}
     * @protected
     */
    this.dp = this.scope['config']['provider'] || null;

    /**
     * HTML ID for the Format Help windows
     * @type {string}
     */
    this.helpWindowId = 'url-help';

    /**
     * The help UI for this provider.
     * @type {string}
     */
    this['helpUi'] = null;

    this.initialize();

    $scope.$on('accept', this.onAccept_.bind(this));
  }

  /**
   * Angular $onDestroy lifecycle hook.
   */
  $onDestroy() {
    this.closeHelpWindow();
  }

  /**
   * Angular $onInit lifecycle hook.
   */
  $onInit() {
    this.scope.$emit(WindowEventType.READY);
  }

  /**
   * Initialize the controller.
   */
  initialize() {
    this.scope['edit'] = this.dp ? this.dp.getEditable() : true;
  }

  /**
   * Set testing state.
   * @param {boolean} value
   */
  setTesting(value) {
    this.scope['testing'] = value;
    this.scope.$emit('testing', value);
  }

  /**
   * Save button handler
   *
   * @export
   */
  accept() {
    if (!this.scope['form']['$invalid'] && !this.scope['testing']) {
      this.cleanConfig();

      if (!this.dp || this.scope['error'] || (this.dp.getEditable() && this.formDiff())) {
        this.test();
      } else if (this.dp && this.dp.getEditable()) {
        this.saveAndClose();
      } else {
        this.close();
      }
    }
  }

  /**
   * Closes the window
   *
   * @export
   */
  close() {
    if (this.dp) {
      this.dp.unlisten(GoogEventType.PROPERTYCHANGE, this.onTestFinished, false, this);
    }

    close(this.element);
  }

  /**
   * Apply the scope
   *
   * @protected
   */
  apply() {
    try {
      this.scope.$apply();
    } catch (e) {}
  }

  /**
   * Tests the data provider to ensure that it loads properly
   *
   * @protected
   */
  test() {
    this.setTesting(true);
    var id = this.dp ? this.dp.getId() : getRandomString();

    this.dp = this.getDataProvider();
    this.dp.setId(id);
    this.dp.setEditable(true);
    this.beforeTest();
    this.dp.listen(GoogEventType.PROPERTYCHANGE, this.onTestFinished, false, this);
    this.dp.load(true);
  }

  /**
   * Test finished handler
   *
   * @param {os.events.PropertyChangeEvent} event
   */
  onTestFinished(event) {
    if (event.getProperty() == 'loading' && !event.getNewValue()) {
      this.dp.unlisten(GoogEventType.PROPERTYCHANGE, this.onTestFinished, false, this);

      this.setTesting(false);
      this.afterTest();

      this.scope['error'] = this.dp.getErrorMessage();

      if (!this.dp.getError()) {
        this.saveAndClose();
      } else {
        this.apply();

        // Scroll to the bottom to show any error messages
        this.scope.$applyAsync(() => {
          // Depending on how this form is embedded, the modal body may be a child or parent.
          let container = this.element.find('.modal-body');
          if (!container.length) {
            container = this.element.closest('.modal-body');
          }

          if (container.length) {
            container.animate({'scrollTop': container[0].scrollHeight}, 500);
          }
        });
      }
    }
  }

  /**
   * Accept handler
   */
  onAccept_() {
    this.accept();
  }

  /**
   * Launches the import help window.
   * @param {string=} opt_providerName The user-facing name for the provider.
   * @export
   */
  launchHelp(opt_providerName) {
    if (!exists(this.helpWindowId) && this['helpUi']) {
      let label = 'URL Format Help';
      if (opt_providerName) {
        label = `${opt_providerName} ${label}`;
      }

      create({
        'label': label,
        'icon': 'fa fa-question-circle',
        'x': '-10',
        'y': 'center',
        'width': '500',
        'height': 'auto',
        'show-close': true,
        'modal': true,
        'id': this.helpWindowId
      }, this['helpUi']);
    } else {
      this.closeHelpWindow();
    }
  }

  /**
   * Launches help window
   * @export
   */
  closeHelpWindow() {
    const helpWindow = getById(this.helpWindowId);
    if (helpWindow) {
      close(helpWindow);
    }
  }

  /**
   * Save and close
   *
   * @protected
   */
  saveAndClose() {
    var config = this.getConfig();
    Settings.getInstance().set([ProviderKey.USER, this.dp.getId()], config);
    // We want to add the test instance as replacement rather than re-configuring the old
    // povider. This avoids reloading the provider again after we just did that to test it.
    DataManager.getInstance().removeProvider(this.dp.getId());
    DataManager.getInstance().addProvider(this.dp);
    // todo Pop up some kind of message about where to find data?
    this.close();
  }

  /**
   * Creates a data provider from the form
   *
   * @abstract
   * @return {IDataProvider} The data provider
   */
  getDataProvider() {}

  /**
   * For use by extension classes to modify the data provider for a test
   */
  beforeTest() {
  }

  /**
   * Preprocess the config prior to passing it to the provider.
   *
   * @protected
   */
  cleanConfig() {}

  /**
   * For use by extension classes to modify the data provider after a test
   */
  afterTest() {
  }

  /**
   * @abstract
   * @return {boolean} True if the form differs from this.dp, false otherwise
   */
  formDiff() {}

  /**
   * Gets the config to be persisted
   *
   * @abstract
   * @return {Object.<string, *>} the config
   * @protected
   */
  getConfig() {}
}
