goog.provide('plugin.file.zip.ui.ZIPProcessStep');
goog.provide('plugin.file.zip.ui.ZIPProcessStepCtrl');

goog.require('goog.log');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
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
plugin.file.zip.ui.ZIPProcessStep = function() {
  plugin.file.zip.ui.ZIPProcessStep.base(this, 'constructor');
  this.template = '<zipprocessstep></zipprocessstep>';
  this.title = 'Unzip file(s)';
};


goog.inherits(plugin.file.zip.ui.ZIPProcessStep, os.ui.wiz.step.AbstractWizardStep);


/**
 * @inheritDoc
 */
plugin.file.zip.ui.ZIPProcessStep.prototype.finalize = function(config) { };


/**
 * The ZIP import file selection step directive
 *
 * @return {angular.Directive}
 */
plugin.file.zip.ui.processStepDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/plugin/zip/zipprocessstep.html',
    controller: plugin.file.zip.ui.ZIPProcessStepCtrl,
    controllerAs: 'processStep'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('zipprocessstep', [plugin.file.zip.ui.processStepDirective]);



/**
 * Controller for the ZIP import file selection step
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
plugin.file.zip.ui.ZIPProcessStepCtrl = function($scope, $element, $timeout) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.$timeout}
   * @private
   */
  this.timeout_ = $timeout;

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

  /**
   * @type {Array.<String>}
   */
  this['msg'] = [];

  /**
   * @type {number}
   */
  this['wait'] = 0;

  this.scope_.$watch('config["status"]', this.onStatusChange.bind(this), false);
  this.scope_.$watch('config["files"]', this.onFilesChange.bind(this), false);

  $scope.$on('$destroy', this.destroy_.bind(this));

  this.validate_();

  goog.log.info(plugin.file.zip.ui.ZIPProcessStepCtrl.LOGGER_, 'SUCCESS!  Initialized zip -- Process Step');
};


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.file.zip.ui.ZIPProcessStepCtrl.LOGGER_ = goog.log.getLogger('plugin.file.zip.ui.ZIPProcessStepCtrl');


/**
 * @param {Array.<Object>} val
 * @param {Array.<Object>} oldVal
 * @param {Object} scope
 * @public
 */
plugin.file.zip.ui.ZIPProcessStepCtrl.prototype.onFilesChange = function(val, oldVal, scope) {
//  this.validate_();
};


/**
 * @param {number} val
 * @param {number} oldVal
 * @param {Object} scope
 * @public
 */
plugin.file.zip.ui.ZIPProcessStepCtrl.prototype.onStatusChange = function(val, oldVal, scope) {
//  this.validate_();
};


/**
 * @private
 */
plugin.file.zip.ui.ZIPProcessStepCtrl.prototype.destroy_ = function() {
  this.config_ = null;
  this.scope_ = null;
};


/**
 * Checks if files have been chosen/validated.
 *
 * @private
 */
plugin.file.zip.ui.ZIPProcessStepCtrl.prototype.validate_ = function() {
  var wait = 750;
  var maxWait = 80 * wait;

  if (!this.config_) return;

  var status = this.config_['status'];
  var nFiles = this.config_['files'] ? this.config_['files'].length : 0;

  this['loading'] = status != 0;
  this['valid'] = !this['loading'];

  var msg = [];
  msg.push('Reading ZIP file...');
  if (status == 0) {
    msg[0] += ' SUCCESS';
    msg.push('Found ' + nFiles + ' file(s)');
    msg.push('Click "Next" to proceed');
  }
  this.msg = msg;
  this.scope_.$emit(os.ui.wiz.step.WizardStepEvent.VALIDATE, this['valid']);

  if (status == 1) {
    if (this['wait'] < maxWait) this.timeout_(this.validate_.bind(this), wait);
    else {
      this['loading'] = false;
      var err = 'Unzipping took too long in browser.  Try unzipping locally first.';
      os.alert.AlertManager.getInstance().sendAlert(err, os.alert.AlertEventSeverity.ERROR);
    }
    this['wait'] += wait;
  }

  os.ui.apply(this.scope_);
};
