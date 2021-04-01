goog.provide('os.ui.ProviderImportCtrl');

goog.require('goog.events.EventType');
goog.require('goog.string');
goog.require('os.config.Settings');
goog.require('os.data');
goog.require('os.ui.window');



/**
 * Controller for the provider import UI
 *
 * @abstract
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.ProviderImportCtrl = function($scope, $element) {
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
   * @type {?os.data.IDataProvider}
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

  setTimeout(() => {
    // This event is sent before window content is fully populated, so delay emitting it
    $scope.$emit(os.ui.WindowEventType.READY);
  }, 0);
  $scope.$on('accept', this.onAccept_.bind(this));
};


/**
 * Angular $onDestroy lifecycle hook.
 */
os.ui.ProviderImportCtrl.prototype.$onDestroy = function() {
  this.closeHelpWindow();
};


/**
 * Initialize the controller.
 */
os.ui.ProviderImportCtrl.prototype.initialize = function() {
  this.scope['edit'] = this.dp ? this.dp.getEditable() : true;
};


/**
 * Set testing state.
 * @param {boolean} value
 */
os.ui.ProviderImportCtrl.prototype.setTesting = function(value) {
  this.scope['testing'] = value;
  this.scope.$emit('testing', value);
};


/**
 * Save button handler
 *
 * @export
 */
os.ui.ProviderImportCtrl.prototype.accept = function() {
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
};


/**
 * Closes the window
 *
 * @export
 */
os.ui.ProviderImportCtrl.prototype.close = function() {
  if (this.dp) {
    this.dp.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onTestFinished, false, this);
  }

  os.ui.window.close(this.element);
};


/**
 * Apply the scope
 *
 * @protected
 */
os.ui.ProviderImportCtrl.prototype.apply = function() {
  try {
    this.scope.$apply();
  } catch (e) {}
};


/**
 * Tests the data provider to ensure that it loads properly
 *
 * @protected
 */
os.ui.ProviderImportCtrl.prototype.test = function() {
  this.setTesting(true);
  var id = this.dp ? this.dp.getId() : goog.string.getRandomString();

  this.dp = this.getDataProvider();
  this.dp.setId(id);
  this.dp.setEditable(true);
  this.beforeTest();
  this.dp.listen(goog.events.EventType.PROPERTYCHANGE, this.onTestFinished, false, this);
  this.dp.load(true);
};


/**
 * Test finished handler
 *
 * @param {os.events.PropertyChangeEvent} event
 */
os.ui.ProviderImportCtrl.prototype.onTestFinished = function(event) {
  if (event.getProperty() == 'loading' && !event.getNewValue()) {
    this.dp.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onTestFinished, false, this);

    this.setTesting(false);
    this.afterTest();

    this.scope['error'] = this.dp.getErrorMessage();

    if (!this.dp.getError()) {
      this.saveAndClose();
    } else {
      this.apply();

      // Scroll to the bottom to show any error messages
      this.scope.$applyAsync(() => {
        const container = this.element.closest('.modal-body');
        container.animate({'scrollTop': container[0].scrollHeight}, 500);
      });
    }
  }
};


/**
 * Accept handler
 */
os.ui.ProviderImportCtrl.prototype.onAccept_ = function() {
  this.accept();
};


/**
 * Launches help window
 * @export
 */
os.ui.ProviderImportCtrl.prototype.launchHelp = function() {
  if (!os.ui.window.exists(this.helpWindowId) && this['helpUi']) {
    os.ui.window.create({
      'label': 'URL Format Help',
      'icon': 'fa fa-question-circle',
      'x': '-10',
      'y': 'center',
      'width': '500',
      'height': '500',
      'show-close': true,
      'modal': true,
      'id': this.helpWindowId
    }, this['helpUi']);
  } else {
    this.closeHelpWindow();
  }
};


/**
 * Launches help window
 * @export
 */
os.ui.ProviderImportCtrl.prototype.closeHelpWindow = function() {
  const helpWindow = os.ui.window.getById(this.helpWindowId);
  if (helpWindow) {
    os.ui.window.close(helpWindow);
  }
};


/**
 * Save and close
 *
 * @protected
 */
os.ui.ProviderImportCtrl.prototype.saveAndClose = function() {
  var config = this.getConfig();
  os.settings.set([os.data.ProviderKey.USER, this.dp.getId()], config);
  // We want to add the test instance as replacement rather than re-configuring the old
  // povider. This avoids reloading the provider again after we just did that to test it.
  os.dataManager.removeProvider(this.dp.getId());
  os.dataManager.addProvider(this.dp);
  // todo Pop up some kind of message about where to find data?
  this.close();
};


/**
 * Creates a data provider from the form
 *
 * @abstract
 * @return {os.data.IDataProvider} The data provider
 */
os.ui.ProviderImportCtrl.prototype.getDataProvider = function() {};


/**
 * For use by extension classes to modify the data provider for a test
 */
os.ui.ProviderImportCtrl.prototype.beforeTest = function() {
};


/**
 * Preprocess the config prior to passing it to the provider.
 *
 * @protected
 */
os.ui.ProviderImportCtrl.prototype.cleanConfig = function() {};


/**
 * For use by extension classes to modify the data provider after a test
 */
os.ui.ProviderImportCtrl.prototype.afterTest = function() {
};


/**
 * @abstract
 * @return {boolean} True if the form differs from this.dp, false otherwise
 */
os.ui.ProviderImportCtrl.prototype.formDiff = function() {};


/**
 * Gets the config to be persisted
 *
 * @abstract
 * @return {Object.<string, *>} the config
 * @protected
 */
os.ui.ProviderImportCtrl.prototype.getConfig = function() {};
