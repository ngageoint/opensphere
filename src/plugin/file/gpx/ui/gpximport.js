goog.provide('plugin.file.gpx.ui.GPXImportCtrl');
goog.provide('plugin.file.gpx.ui.gpxImportDirective');
goog.require('os.data.DataManager');
goog.require('os.defines');
goog.require('os.file.FileStorage');
goog.require('os.ui.Module');
goog.require('os.ui.WindowEventType');
goog.require('os.ui.window');
goog.require('plugin.file.gpx.GPXDescriptor');
goog.require('plugin.file.gpx.GPXProvider');


/**
 * The gpxImport directive
 * @return {angular.Directive}
 */
plugin.file.gpx.ui.gpxImportDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/plugin/gpx/gpximport.html',
    controller: plugin.file.gpx.ui.GPXImportCtrl,
    controllerAs: 'gpxImport'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('gpximport', [plugin.file.gpx.ui.gpxImportDirective]);



/**
 * Controller function for the gpxImport directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
plugin.file.gpx.ui.GPXImportCtrl = function($scope, $element) {
  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {os.parse.FileParserConfig}
   * @private
   */
  this.config_ = $scope['config'];

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up.
 * @private
 */
plugin.file.gpx.ui.GPXImportCtrl.prototype.destroy_ = function() {
  this.element_ = null;
};


/**
 * Clean up the parser configuration, removing any references it doesn't need.
 * @private
 */
plugin.file.gpx.ui.GPXImportCtrl.prototype.cleanConfig_ = function() {
  if (this.config_) {
    this.config_['file'] = null;
    this.config_['descriptor'] = null;
  }
};


/**
 * Create import command and close the window
 */
plugin.file.gpx.ui.GPXImportCtrl.prototype.accept = function() {
  var descriptor = null;
  if (this.config_['descriptor']) {
    // existing descriptor. deactivate the descriptor, then update it
    descriptor = this.config_['descriptor'];
    descriptor.setActive(false);
    plugin.file.gpx.GPXDescriptor.updateFromConfig(descriptor, this.config_);
  } else {
    // this is a new import
    descriptor = plugin.file.gpx.GPXDescriptor.createFromConfig(this.config_);
  }

  var url = this.config_['file'].getUrl();
  if (url && os.file.isLocal(url)) {
    // local file, so store it before finishing the import
    this.storeLocal(descriptor);
  } else {
    // remote file, so just finish the import
    this.finishImport(descriptor);
  }

  os.ui.window.close(this.element_);
};
goog.exportProperty(plugin.file.gpx.ui.GPXImportCtrl.prototype, 'accept',
    plugin.file.gpx.ui.GPXImportCtrl.prototype.accept);


/**
 * Cancel file import
 */
plugin.file.gpx.ui.GPXImportCtrl.prototype.cancel = function() {
  this.cleanConfig_();
  os.ui.window.close(this.element_);
};
goog.exportProperty(plugin.file.gpx.ui.GPXImportCtrl.prototype, 'cancel',
    plugin.file.gpx.ui.GPXImportCtrl.prototype.cancel);


/**
 * Store the local file being imported.
 * @param {!plugin.file.gpx.GPXDescriptor} descriptor
 * @protected
 */
plugin.file.gpx.ui.GPXImportCtrl.prototype.storeLocal = function(descriptor) {
  // store with replace enabled in case the file already exists
  os.file.FileStorage.getInstance().storeFile(this.config_['file'], true)
      .addCallbacks(goog.partial(this.finishImport, descriptor), this.onPersistError_, this);
};


/**
 * Import complete, so add the descriptor to the data manager and provider.
 * @param {!plugin.file.gpx.GPXDescriptor} descriptor
 * @protected
 */
plugin.file.gpx.ui.GPXImportCtrl.prototype.finishImport = function(descriptor) {
  os.dataManager.addDescriptor(descriptor);
  plugin.file.gpx.GPXProvider.getInstance().addDescriptor(descriptor);
  this.cleanConfig_();
};


/**
 * @param {goog.db.Error} error
 * @private
 */
plugin.file.gpx.ui.GPXImportCtrl.prototype.onPersistError_ = function(error) {
  var msg = 'Failed storing local file! Unable to finish import.';
  os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.ERROR);

  this.cleanConfig_();
};
