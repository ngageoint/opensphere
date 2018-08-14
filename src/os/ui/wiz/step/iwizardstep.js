goog.provide('os.ui.wiz.step.IWizardStep');



/**
 * @interface
 * @template T
 */
os.ui.wiz.step.IWizardStep = function() {};


/**
 * Priority used for wizards that auto sort steps. Steps will be ordered from high to low priority.
 * @type {number}
 */
os.ui.wiz.step.IWizardStep.prototype.priority;


/**
 * Initializes the step using the provided configuration. If a scope and parent are also provided, the step
 * will be compiled and added to the parent.
 * @param {T} config The wizard configuration.
 * @param {angular.Scope=} opt_scope
 * @param {angular.JQLite=} opt_parent
 */
os.ui.wiz.step.IWizardStep.prototype.activate;


/**
 * Deactivate and clean up the step.
 * @param {T} config The wizard configuration.
 */
os.ui.wiz.step.IWizardStep.prototype.deactivate;


/**
 * Get the HTML template for the step.
 * @return {string}
 */
os.ui.wiz.step.IWizardStep.prototype.getTemplate;


/**
 * Get the title for this step.
 * @return {string}
 */
os.ui.wiz.step.IWizardStep.prototype.getTitle;


/**
 * If the step has been compiled and added to the DOM.
 * @return {boolean}
 */
os.ui.wiz.step.IWizardStep.prototype.isCompiled;


/**
 * If the step has been deactivated
 * @return {boolean}
 */
os.ui.wiz.step.IWizardStep.prototype.isDeactivated;


/**
 * If the step is valid, allowing the wizard to continue.
 * @param {T} config The wizard configuration.
 * @return {boolean}
 */
os.ui.wiz.step.IWizardStep.prototype.isValid;
