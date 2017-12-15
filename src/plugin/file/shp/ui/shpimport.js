goog.provide('plugin.file.shp.ui.SHPImportCtrl');
goog.provide('plugin.file.shp.ui.shpImportDirective');

goog.require('os.data.DataManager');
goog.require('os.file.FileStorage');
goog.require('os.ui.Module');
goog.require('os.ui.im.FileImportWizard');
goog.require('os.ui.wiz.wizardDirective');
goog.require('plugin.file.shp.SHPDescriptor');
goog.require('plugin.file.shp.SHPParserConfig');
goog.require('plugin.file.shp.SHPProvider');



/**
 * Controller for the SHP import wizard window
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @param {!Object.<string, string>} $attrs
 * @extends {os.ui.im.FileImportWizard.<!plugin.file.shp.SHPParserConfig,!plugin.file.shp.SHPDescriptor>}
 * @constructor
 * @ngInject
 */
plugin.file.shp.ui.SHPImportCtrl = function($scope, $element, $timeout, $attrs) {
  plugin.file.shp.ui.SHPImportCtrl.base(this, 'constructor', $scope, $element, $timeout, $attrs);
};
goog.inherits(plugin.file.shp.ui.SHPImportCtrl, os.ui.im.FileImportWizard);


/**
 * @inheritDoc
 */
plugin.file.shp.ui.SHPImportCtrl.prototype.cleanConfig = function() {
  if (this.config) {
    this.config['file2'] = null;
    this.config['zipFile'] = null;
  }

  plugin.file.shp.ui.SHPImportCtrl.base(this, 'cleanConfig');
};


/**
 * @inheritDoc
 */
plugin.file.shp.ui.SHPImportCtrl.prototype.storeAndFinish = function(descriptor) {
  if (this.config['zipFile']) {
    if (os.file.isLocal(this.config['zipFile'])) {
      // store the ZIP
      this.fs.storeFile(this.config['zipFile'], true)
          .addCallbacks(goog.partial(this.finishImport, descriptor), this.onPersistError, this);
    } else {
      // local zip - finish up
      this.finishImport(descriptor);
    }
  } else {
    var localShp = os.file.isLocal(this.config['file']);
    var localDbf = os.file.isLocal(this.config['file2']);
    if (localShp && localDbf) {
      // store both the SHP and DBF
      this.fs.storeFile(this.config['file2'], true)
          .awaitDeferred(this.fs.storeFile(this.config['file'], true))
          .addCallbacks(goog.partial(this.finishImport, descriptor), this.onPersistError, this);
    } else if (localShp) {
      // store the SHP
      this.fs.storeFile(this.config['file'], true)
          .addCallbacks(goog.partial(this.finishImport, descriptor), this.onPersistError, this);
    } else if (localDbf) {
      // store the DBF
      this.fs.storeFile(this.config['file2'], true)
          .addCallbacks(goog.partial(this.finishImport, descriptor), this.onPersistError, this);
    } else {
      // both local - finish up
      this.finishImport(descriptor);
    }
  }
};


/**
 * @param {!plugin.file.shp.SHPDescriptor} descriptor
 * @protected
 * @override
 */
plugin.file.shp.ui.SHPImportCtrl.prototype.addDescriptorToProvider = function(descriptor) {
  plugin.file.shp.SHPProvider.getInstance().addDescriptor(descriptor);
};


/**
 * @param {!plugin.file.shp.SHPParserConfig} config
 * @return {!plugin.file.shp.SHPDescriptor}
 * @protected
 * @override
 */
plugin.file.shp.ui.SHPImportCtrl.prototype.createFromConfig = function(config) {
  return plugin.file.shp.SHPDescriptor.createFromConfig(this.config);
};


/**
 * @param {!plugin.file.shp.SHPDescriptor} descriptor
 * @param {!plugin.file.shp.SHPParserConfig} config
 * @protected
 * @override
 */
plugin.file.shp.ui.SHPImportCtrl.prototype.updateFromConfig = function(descriptor, config) {
  plugin.file.shp.SHPDescriptor.updateFromConfig(descriptor, config);
};


/**
 * The SHP import wizard directive.
 * @return {angular.Directive}
 */
plugin.file.shp.ui.shpImportDirective = function() {
  var dir = os.ui.wiz.wizardDirective();
  dir.controller = plugin.file.shp.ui.SHPImportCtrl;
  return dir;
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('shpimport', [plugin.file.shp.ui.shpImportDirective]);
