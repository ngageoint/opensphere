goog.provide('plugin.file.zip.ui.ZIPImportCtrl');
goog.provide('plugin.file.zip.ui.zipImportDirective');

goog.require('os.defines');
goog.require('os.file.File');
goog.require('os.ui.Module');
goog.require('os.ui.im.FileImportWizard');
goog.require('os.ui.wiz.wizardDirective');
goog.require('plugin.file.zip.ZIPDescriptor');
goog.require('plugin.file.zip.ZIPParserConfig');
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


/**
 * Add the directive to the module
 */
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
 * @inheritDoc
 */
plugin.file.zip.ui.ZIPImportCtrl.prototype.storeAndFinish = function(descriptor) {
  console.log('double-woot!', this);
  var entries = descriptor.parserConfig.files;

  if (!entries) {
    // TODO warn
    return;
  }
  
  var waiting = false;
  var parser = new plugin.file.zip.ZIPParser(descriptor.parserConfig);

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (entry.selected === true) {
      waiting = true;

      var file = entry.file;

      this.fs
        .storeFile(file, true)
        .addCallbacks(goog.partial(this.finishImport, descriptor), this.onPersistError, this);
    }
  }

  if (!waiting) plugin.file.zip.ui.ZIPImportCtrl.base(this, 'storeAndFinish');
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
