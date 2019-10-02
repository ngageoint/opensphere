goog.provide('plugin.file.zip.ui.ZIPFilesStep');
goog.provide('plugin.file.zip.ui.ZIPFilesStepCtrl');

goog.require('goog.log');
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
  this.title = 'Files';
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
 * The ZIP import file selection step directive
 *
 * @return {angular.Directive}
 */
plugin.file.zip.ui.configStepDirective = function() {
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
os.ui.Module.directive('zipfilesstep', [plugin.file.zip.ui.configStepDirective]);



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
   * @type {boolean}
   */
  this['loading'] = false;

  /**
   * @type {boolean}
   */
  this['valid'] = false;

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
