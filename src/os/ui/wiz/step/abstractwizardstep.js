goog.provide('os.ui.wiz.step.AbstractWizardStep');
goog.provide('os.ui.wiz.step.AbstractWizardStepCtrl');
goog.provide('os.ui.wiz.step.WizardStepEvent');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.ui.wiz.step.IWizardStep');


/**
 * Events that can be fired by the wizard step controller.
 * @enum {string}
 */
os.ui.wiz.step.WizardStepEvent = {
  VALIDATE: 'validate'
};



/**
 * Base wizard step implementation. This implements the base activate behavior that will compile the step
 * template and add it to a parent, and deactivate behavior to clean up the step directive. It also tracks
 * step validity events fired as a result of internal validity changes (parsing errors, form validation changes,
 * etc). Event-based changes to validity also apply the wizard scope immediately. Step directives are responsible
 * for firing these events when necessary.
 *
 * @param {angular.$compile=} opt_compile Angular compile function
 * @implements {os.ui.wiz.step.IWizardStep<T>}
 * @constructor
 * @template T
 */
os.ui.wiz.step.AbstractWizardStep = function(opt_compile) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = null;

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = null;

  /**
   * @type {?angular.$compile}
   * @private
   */
  this.compile_ = opt_compile || null;

  /**
   * @type {boolean}
   * @protected
   */
  this.valid = true;

  /**
   * @type {string}
   * @protected
   */
  this.template = '<span>Placeholder template.</span>';

  /**
   * @type {string}
   * @protected
   */
  this.title = 'Placeholder Title';

  /**
   * @type {boolean}
   * @protected
   */
  this.initialized = false;

  /**
   * @type {boolean}
   * @protected
   */
  this.deactivated = false;

  /**
   * @inheritDoc
   */
  this.priority = 0;

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.ui.wiz.step.AbstractWizardStep.LOGGER_;
};


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.wiz.step.AbstractWizardStep.LOGGER_ = goog.log.getLogger('os.ui.wiz.step.AbstractWizardStep');


/**
 * Handles validity changes on the step scope.
 * @param {angular.Scope.Event} event
 * @param {boolean=} opt_valid
 * @private
 */
os.ui.wiz.step.AbstractWizardStep.prototype.onStepValidityChange_ = function(event, opt_valid) {
  if (goog.isDef(opt_valid)) {
    this.valid = opt_valid;
  }
};


/**
 * @inheritDoc
 */
os.ui.wiz.step.AbstractWizardStep.prototype.activate = function(config, opt_scope, opt_parent) {
  this.initialize(config);

  if (opt_scope && opt_parent) {
    this.scope = opt_scope;
    this.scope['step'] = this;
    this.scope.$on(os.ui.wiz.step.WizardStepEvent.VALIDATE, this.onStepValidityChange_.bind(this));

    var compile = this.compile_ || opt_parent.injector().get('$compile');
    var template = this.getTemplate();
    if (compile && template) {
      opt_parent.html(this.getTemplate());
      this.element = compile(opt_parent.contents())(opt_scope);
    }
  }

  this.deactivated = false;
};


/**
 * @inheritDoc
 */
os.ui.wiz.step.AbstractWizardStep.prototype.deactivate = function(config) {
  this.finalize(config);

  if (this.scope) {
    delete this.scope['step'];
    this.scope.$destroy();
    this.scope = null;
  }

  if (this.element) {
    this.element.remove();
    this.element = null;
  }

  this.deactivated = true;
};


/**
 * Initializes the wizard step from the provided configuration.
 * @param {T} config The wizard configuration.
 */
os.ui.wiz.step.AbstractWizardStep.prototype.initialize = function(config) {
  this.initialized = true;
};


/**
 * Perform actions against the wizard configuration before the next step.
 * @param {T} config The wizard configuration.
 */
os.ui.wiz.step.AbstractWizardStep.prototype.finalize = function(config) {
  // intended for overriding classes
};


/**
 * @inheritDoc
 */
os.ui.wiz.step.AbstractWizardStep.prototype.getTemplate = function() {
  return this.template;
};


/**
 * @inheritDoc
 */
os.ui.wiz.step.AbstractWizardStep.prototype.getTitle = function() {
  return this.title;
};
goog.exportProperty(
    os.ui.wiz.step.AbstractWizardStep.prototype,
    'getTitle',
    os.ui.wiz.step.AbstractWizardStep.prototype.getTitle);


/**
 * @inheritDoc
 */
os.ui.wiz.step.AbstractWizardStep.prototype.isCompiled = function() {
  return this.scope != null;
};


/**
 * @inheritDoc
 */
os.ui.wiz.step.AbstractWizardStep.prototype.isDeactivated = function() {
  return this.deactivated;
};


/**
 * @inheritDoc
 */
os.ui.wiz.step.AbstractWizardStep.prototype.isValid = function(config) {
  return this.valid;
};



/**
 * Abstract wizard step controller.
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 * @template T,S
 */
os.ui.wiz.step.AbstractWizardStepCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * The wizard configuration.
   * @type {T}
   * @protected
   */
  this.config = $scope['config'];
  goog.asserts.assert(!!this.config, 'Wizard configuration not defined on scope');

  /**
   * The wizard step.
   * @type {S}
   * @protected
   */
  this.step = $scope['step'];
  goog.asserts.assert(!!this.step, 'Wizard step not defined on scope');

  $scope.$on('$destroy', this.destroy.bind(this));
};


/**
 * Clean up everything!
 * @protected
 */
os.ui.wiz.step.AbstractWizardStepCtrl.prototype.destroy = function() {
  this.scope = null;
  this.config = null;
  this.step = null;
};


/**
 * Fire a step validity change/update event. If a validity is provided, the step's valid flag will be updated.
 * @protected
 */
os.ui.wiz.step.AbstractWizardStepCtrl.prototype.fireValidity = function() {
  this.scope.$emit(os.ui.wiz.step.WizardStepEvent.VALIDATE, this.isValid());
};


/**
 * Test if the step is valid.
 * @return {boolean}
 * @protected
 */
os.ui.wiz.step.AbstractWizardStepCtrl.prototype.isValid = function() {
  return true;
};
