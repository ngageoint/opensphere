goog.provide('plugin.file.zip.ui.ZIPFilesStep');
goog.provide('plugin.file.zip.ui.ZIPFilesStepCtrl');

goog.require('goog.log');
goog.require('os.data.ColumnDefinition');
goog.require('os.defines');
goog.require('os.file.File');
goog.require('os.ui.Module');
goog.require('os.ui.file.method.UrlMethod');
goog.require('os.ui.wiz.step.AbstractWizardStep');
goog.require('os.ui.wiz.step.WizardStepEvent');
goog.require('os.ui.wiz.wizardPreviewDirective');
goog.require('plugin.file.zip');
goog.require('plugin.file.zip.ZIPParserConfig');


/**
 * ZIP import file selection step
 *
 * @extends {os.ui.wiz.step.AbstractWizardStep.<plugin.file.zip.ZIPParserConfig>}
 * @constructor
 */
plugin.file.zip.ui.ZIPFilesStep = function() {
  plugin.file.zip.ui.ZIPFilesStep.base(this, 'constructor');
  this.template = '<zipfilesstep></zipfilesstep>';
  this.title = 'Choose file(s)';
};


goog.inherits(plugin.file.zip.ui.ZIPFilesStep, os.ui.wiz.step.AbstractWizardStep);


/**
 * @inheritDoc
 */
plugin.file.zip.ui.ZIPFilesStep.prototype.finalize = function(config) {
  try {
    config.updatePreview();

    var features = config['preview'];
    if ((!config['mappings'] || config['mappings'].length <= 0) && features && features.length > 0) {
      // no mappings have been set yet, so try to auto detect them
      var mm = os.im.mapping.MappingManager.getInstance();
      var mappings = mm.autoDetect(features);
      if (mappings && mappings.length > 0) {
        config['mappings'] = mappings;
      }
    }
  } catch (e) {
  }
};


/**
 * Simple formatter to create checkmark on "selected" when rendering slickgrid
 *
 * @param {!number} row
 * @param {!number} cell
 * @param {!*} value
 * @param {!Object} columnDef
 * @param {!Object} dataContext
 * @return {!string}
 * @private
 */
plugin.file.zip.ui.formatter = function(row, cell, value, columnDef, dataContext) {
  var html = [];

  // match the angular in zipfilestep.html
  html.push('<div onclick="var _s = angular.element(this).scope(); _s.$parent.filesStep.toggle(_s, '
    + dataContext['id']
    + ');">');

  if (dataContext['selected']) html.push('<i class="fa fa-check"></i> ');
  else html.push('<span>&nbsp;&nbsp;</span> ');

  html.push(dataContext['filename']);
  html.push('</div>');

  return html.join('');
};


/**
 * The ZIP import file selection step directive
 *
 * @return {angular.Directive}
 */
plugin.file.zip.ui.filesStepDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/plugin/zip/zipfilesstep.html',
    controller: plugin.file.zip.ui.ZIPFilesStepCtrl,
    controllerAs: 'filesStep'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('zipfilesstep', [plugin.file.zip.ui.filesStepDirective]);



/**
 * Controller for the ZIP import file selection step
 *
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
plugin.file.zip.ui.ZIPFilesStepCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {plugin.file.zip.ZIPParserConfig}
   * @private
   */
  this.config_ = /** @type {plugin.file.zip.ZIPParserConfig} */ ($scope['config']);

  /**
   * @type {Array.<Object>}
   */
  this['files'] = this.config_['files'];

  /**
   * @type {boolean}
   */
  this['loading'] = false;

  /**
   * @type {boolean}
   */
  this['valid'] = false;

  /**
   * @type {Array.<os.data.ColumnDefinition>}
   */
  this['columnDefinitions'] = [
    new os.data.ColumnDefinition()
  ];

  this['columnDefinitions'][0].restore({
    'id': 'filename',
    'editable': false,
    'field': 'filename',
    'formatter': plugin.file.zip.ui.formatter,
    'name': 'Filename',
    'selectable': false,
    'sortable': false
  });

  /**
   * @type {Object}
   */
  this['gridOptions'] = {
    'editable': true,
    'enableAutoResize': true,
    'enableRowSelection': false,
    'forceFitColumns': true,
    'fullWidthRows': true,
    'multiSelect': false
  };

  $scope.$on('$destroy', this.destroy_.bind(this));

  this.validate_();

  var msg = 'SUCCESS!  Initialized zip -- Files Step';

  goog.log.info(plugin.file.zip.ui.ZIPFilesStepCtrl.LOGGER_, msg);
};


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.file.zip.ui.ZIPFilesStepCtrl.LOGGER_ = goog.log.getLogger('plugin.file.zip.ui.ZIPFilesStepCtrl');


/**
 * @private
 */
plugin.file.zip.ui.ZIPFilesStepCtrl.prototype.destroy_ = function() {
  this.config_ = null;
  this.scope_ = null;
};


/**
 * Checks if files have been chosen/validated.
 *
 * @private
 */
plugin.file.zip.ui.ZIPFilesStepCtrl.prototype.validate_ = function() {
  this['valid'] = true;
  this['loading'] = this.config_['parsing'];

  this.scope_.$emit(os.ui.wiz.step.WizardStepEvent.VALIDATE, this['valid']);

  os.ui.apply(this.scope_);
};


/**
 * Toggles true/false for file.selected and notifies SlickGrid
 *
 * @param {!Object} scope
 * @param {!number} id
 */
plugin.file.zip.ui.ZIPFilesStepCtrl.prototype.toggle = function(scope, id) {
  if (scope && id) {
    var idx = -1;
    var file = this['files'].find(function(e) {
      idx++;
      return e.id == id;
    });

    if (file) {
      file.selected = !file.selected;
      scope['gridCtrl'].grid.updateRow(idx); // just invalidate them all if sorting is added: scope.gridCtrl.invalidateRows();
    }
  } else {
    scope = this.scope_['$$childHead'];

    var selected = !this['files'][0].selected;
    this['files'].forEach(function(file) {
      file.selected = selected;
    });

    if (scope) scope['gridCtrl'].invalidateRows();
  }
  os.ui.apply(this.scope_);
};


/**
 * Returns a count of the number of "selected" files for the UI
 * @return {number}
 */
plugin.file.zip.ui.ZIPFilesStepCtrl.prototype.count = function() {
  return (this['files'])
    ? this['files'].reduce(function(a, v) {
      if (typeof a == 'object') a = (a.selected ? 1 : 0);
      if (v.selected) a++;
      return a;
    })
    : 0;
};
