goog.provide('plugin.area.SHPAreaCtrl');
goog.provide('plugin.area.SHPAreaImportUI');
goog.provide('plugin.area.shpAreaDirective');

goog.require('os.defines');
goog.require('os.im.Importer');
goog.require('os.ui.im.FileImportUI');
goog.require('os.ui.query');
goog.require('os.ui.windowSelector');
goog.require('os.ui.wiz.step.WizardStepEvent');
goog.require('plugin.area.AreaImportCtrl');
goog.require('plugin.file.shp.SHPParser');
goog.require('plugin.file.shp.SHPParserConfig');
goog.require('plugin.file.shp.mime');
goog.require('plugin.file.shp.ui.SHPFilesStep');



/**
 * @extends {os.ui.im.FileImportUI.<plugin.file.shp.SHPParserConfig>}
 * @constructor
 */
plugin.area.SHPAreaImportUI = function() {
  plugin.area.SHPAreaImportUI.base(this, 'constructor');

  // file contents are only used in memory, not loaded from storage
  this.requiresStorage = false;
};
goog.inherits(plugin.area.SHPAreaImportUI, os.ui.im.FileImportUI);


/**
 * @inheritDoc
 */
plugin.area.SHPAreaImportUI.prototype.getTitle = function() {
  return 'Area Import - SHP';
};


/**
 * @inheritDoc
 */
plugin.area.SHPAreaImportUI.prototype.launchUI = function(file, opt_config) {
  plugin.area.SHPAreaImportUI.base(this, 'launchUI', file, opt_config);

  var config = new plugin.file.shp.SHPParserConfig();

  // determine if the initial file is the DBF or SHP file
  var name = file.getFileName();
  if (plugin.file.shp.mime.SHP_EXT_REGEXP.test(name)) {
    config['file'] = file;
    config['title'] = name;
  } else if (plugin.file.shp.mime.DBF_EXT_REGEXP.test(name)) {
    config['file2'] = file;
    config['title'] = name.split(plugin.file.shp.mime.DBF_EXT_REGEXP)[0] + '.shp';
  } else {
    config['zipFile'] = file;
    config['title'] = name;
  }

  var scopeOptions = {
    'config': config
  };
  var windowOptions = {
    'label': 'SHP Area Import',
    'icon': 'fa fa-sign-in',
    'x': 'center',
    'y': 'center',
    'width': '450',
    'min-width': '300',
    'max-width': '800',
    'height': 'auto',
    'modal': 'true',
    'show-close': 'true'
  };
  var template = '<shparea resize-with="' + os.ui.windowSelector.WINDOW + '"></shparea>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};


/**
 * The SHP import file selection area directive
 *
 * @return {angular.Directive}
 */
plugin.area.shpAreaDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/plugin/shp/shparea.html',
    controller: plugin.area.SHPAreaCtrl,
    controllerAs: 'areaFiles'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('shparea', [plugin.area.shpAreaDirective]);



/**
 * Controller for the SHP import file selection step
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout The Angular $timeout service.
 * @extends {plugin.area.AreaImportCtrl<plugin.file.shp.SHPParserConfig>}
 * @constructor
 * @ngInject
 */
plugin.area.SHPAreaCtrl = function($scope, $element, $timeout) {
  plugin.area.SHPAreaCtrl.base(this, 'constructor', $scope, $element, $timeout);

  this.scope.$on(os.ui.wiz.step.WizardStepEvent.VALIDATE, this.onFileChange_.bind(this));

  // If this is the zip file, run the preview
  if (this.config['zipFile']) {
    this.config.updateZipPreview(os.ui.apply.bind(this, this.scope));
  }
};
goog.inherits(plugin.area.SHPAreaCtrl, plugin.area.AreaImportCtrl);


/**
 * Update Title/Description
 *
 * @param {angular.Scope.Event} event The Angular event
 * @param {boolean} valid
 * @private
 */
plugin.area.SHPAreaCtrl.prototype.onFileChange_ = function(event, valid) {
  this.config.updatePreview();
  os.ui.apply(this.scope);
};


/**
 * Validate the done button
 *
 * @return {boolean} if the form is valid
 * @export
 */
plugin.area.SHPAreaCtrl.prototype.invalid = function() {
  var config = this.config;
  if (config['zipFile']) {
    return !config['columns'] || config['columns'].length == 0 || (!config['title'] && !config['titleColumn']);
  } else {
    return !config['file'] || !config['file2'] || (!config['title'] && !config['titleColumn']);
  }
};


/**
 * @inheritDoc
 * @export
 */
plugin.area.SHPAreaCtrl.prototype.finish = function() {
  plugin.area.SHPAreaCtrl.base(this, 'finish');

  var parser = new plugin.file.shp.SHPParser(this.config);
  var importer = new os.im.Importer(parser);
  importer.listenOnce(os.events.EventType.COMPLETE, this.onImportComplete_, false, this);

  if (this.config['zipFile']) {
    importer.startImport(this.config['zipFile'].getContent());
  } else {
    importer.startImport([this.config['file'].getContent(), this.config['file2'].getContent()]);
  }
};


/**
 * Success callback for importing data. Adds the areas to Area Manager
 *
 * @param {goog.events.Event} event
 * @private
 */
plugin.area.SHPAreaCtrl.prototype.onImportComplete_ = function(event) {
  var importer = /** @type {os.im.Importer} */ (event.target);
  var features = /** @type {!Array<ol.Feature>} */ (importer.getData() || []);
  importer.dispose();

  this.processFeatures(features);
  this.close();
};
