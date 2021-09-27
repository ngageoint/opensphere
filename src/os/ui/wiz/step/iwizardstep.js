goog.declareModuleId('os.ui.wiz.step.IWizardStep');

/**
 * @interface
 * @template T
 */
export default class IWizardStep {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * Priority used for wizards that auto sort steps. Steps will be ordered from high to low priority.
     * @type {number}
     */
    this.priority;
  }

  /**
   * Initializes the step using the provided configuration. If a scope and parent are also provided, the step
   * will be compiled and added to the parent.
   * @param {T} config The wizard configuration.
   * @param {angular.Scope=} opt_scope
   * @param {angular.JQLite=} opt_parent
   */
  activate(config, opt_scope, opt_parent) {}

  /**
   * Deactivate and clean up the step.
   * @param {T} config The wizard configuration.
   */
  deactivate(config) {}

  /**
   * Get the HTML template for the step.
   * @return {string}
   */
  getTemplate() {}

  /**
   * Get the title for this step.
   * @return {string}
   */
  getTitle() {}

  /**
   * If the step has been compiled and added to the DOM.
   * @return {boolean}
   */
  isCompiled() {}

  /**
   * If the step has been deactivated
   * @return {boolean}
   */
  isDeactivated() {}

  /**
   * If the step is valid, allowing the wizard to continue.
   * @param {T} config The wizard configuration.
   * @return {boolean}
   */
  isValid(config) {}
}
