goog.provide('os.ui.wiz.step.TimeStep');
goog.provide('os.ui.wiz.step.TimeStepCtrl');

goog.require('os.im.mapping');
goog.require('os.im.mapping.TimeType');
goog.require('os.im.mapping.time.DateTimeMapping');
goog.require('os.time');
goog.require('os.ui.Module');
goog.require('os.ui.im.mapping.time.TimeMappingModel');
goog.require('os.ui.window.timeHelpDirective');
goog.require('os.ui.wiz.step.AbstractWizardStep');
goog.require('os.ui.wiz.step.WizardStepEvent');
goog.require('os.ui.wiz.step.timeInstantUIDirective');
goog.require('os.ui.wiz.wizardPreviewDirective');



/**
 * Import wizard time step
 * @extends {os.ui.wiz.step.AbstractWizardStep}
 * @constructor
 */
os.ui.wiz.step.TimeStep = function() {
  os.ui.wiz.step.TimeStep.base(this, 'constructor');
  this.template = '<timestep></timestep>';
  this.title = 'Time';

  /**
   * @type {string}
   */
  this['timeType'] = 'none';

  /**
   * @type {os.ui.im.mapping.time.TimeMappingModel}
   */
  this['startModel'] = new os.ui.im.mapping.time.TimeMappingModel();

  /**
   * @type {os.ui.im.mapping.time.TimeMappingModel}
   */
  this['endModel'] = new os.ui.im.mapping.time.TimeMappingModel(os.im.mapping.TimeType.END);
};
goog.inherits(os.ui.wiz.step.TimeStep, os.ui.wiz.step.AbstractWizardStep);


/**
 * @inheritDoc
 */
os.ui.wiz.step.TimeStep.prototype.initialize = function(config) {
  if (!this.initialized && config['mappings'] && config['mappings'].length > 0) {
    var startMappings = [];
    var endMappings = [];

    // find all time mappings, separating them by type
    var i = config['mappings'].length;
    while (i--) {
      var m = config['mappings'][i];
      if (m instanceof os.im.mapping.time.DateTimeMapping) {
        var dtm = /** @type {os.im.mapping.time.DateTimeMapping} */ (m);
        if (dtm.getType() == os.im.mapping.TimeType.END) {
          endMappings.push(m);
        } else {
          startMappings.push(m);
        }
      }
    }

    // update configuration from the mappings
    if (startMappings.length > 0) {
      this['startModel'].updateFromMappings(startMappings);
      this['timeType'] = 'instant';
    }

    if (endMappings.length > 0) {
      this['endModel'].updateFromMappings(endMappings);
      this['timeType'] = 'range';
    }

    os.ui.wiz.step.TimeStep.base(this, 'initialize', config);
  }
};


/**
 * @inheritDoc
 */
os.ui.wiz.step.TimeStep.prototype.finalize = function(config) {
  // remove previous time mappings
  if (config['mappings']) {
    var i = config['mappings'].length;
    while (i--) {
      var m = config['mappings'][i];
      if (m instanceof os.im.mapping.time.DateTimeMapping) {
        config['mappings'].splice(i, 1);
      }
    }
  }

  // generate mappings from the UI
  var mappings = [];
  if (this['timeType'] != 'none') {
    config['skipTimeMappings'] = false;
    if (this['timeType'] == 'instant') {
      this['startModel'].setType(os.im.mapping.TimeType.INSTANT);
      mappings = mappings.concat(this['startModel'].generateMappings());
    } else if (this['timeType'] == 'range') {
      this['startModel'].setType(os.im.mapping.TimeType.START);
      mappings = mappings.concat(this['startModel'].generateMappings());
      mappings = mappings.concat(this['endModel'].generateMappings());
    }

    // add new time mapping(s)
    if (mappings.length > 0) {
      if (config['mappings']) {
        config['mappings'] = config['mappings'].concat(mappings);
      } else {
        config['mappings'] = mappings;
      }
    }
  } else {
    // indicate the time mapping needs to be removed
    config['skipTimeMappings'] = true;
  }
};


/**
 * @inheritDoc
 */
os.ui.wiz.step.TimeStep.prototype.isValid = function(config) {
  if (this['timeType'] == 'instant') {
    return this.valid && this['startModel'].validate();
  } else if (this['timeType'] == 'range') {
    return this.valid && this['startModel'].validate() && this['endModel'].validate();
  }

  // no time - always valid
  return true;
};


/**
 * The import wizard time step directive
 * @return {angular.Directive}
 */
os.ui.wiz.step.timeStepDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/wiz/timestep.html',
    controller: os.ui.wiz.step.TimeStepCtrl,
    controllerAs: 'timeStep'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('timestep', [os.ui.wiz.step.timeStepDirective]);



/**
 * Controller for the import wizard time step
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.wiz.step.TimeStepCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {boolean}
   */
  this['startValid'] = true;

  /**
   * @type {boolean}
   */
  this['endValid'] = true;

  $scope.$watch('step.timeType', this.validate_.bind(this));
  $scope.$watch('step.startModel.dateType', this.resizePreview_.bind(this));
  $scope.$watch('step.endModel.dateType', this.resizePreview_.bind(this));
  $scope.$watch('timeStep.startValid', this.validate_.bind(this));
  $scope.$watch('timeStep.endValid', this.validate_.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up references/listeners.
 * @private
 */
os.ui.wiz.step.TimeStepCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
};


/**
 * Fires an event to make the preview resize itself.
 * @private
 */
os.ui.wiz.step.TimeStepCtrl.prototype.resizePreview_ = function() {
  this.scope_.$broadcast('resizePreview');
};


/**
 * Emits a validation event.
 * @private
 */
os.ui.wiz.step.TimeStepCtrl.prototype.validate_ = function() {
  var timeType = this.scope_['step']['timeType'];
  var valid = true;
  if (timeType == 'range') {
    valid = this['startValid'] && this['endValid'];
  } else if (timeType == 'instant') {
    valid = this['startValid'];
  }

  this.scope_.$emit(os.ui.wiz.step.WizardStepEvent.VALIDATE, valid);
  this.resizePreview_();
};


/**
 * Launches the date/time formatting help dialog.
 */
os.ui.wiz.step.TimeStepCtrl.prototype.launchHelp = function() {
  os.ui.window.launchTimeHelp();
};
goog.exportProperty(
    os.ui.wiz.step.TimeStepCtrl.prototype,
    'launchHelp',
    os.ui.wiz.step.TimeStepCtrl.prototype.launchHelp);
