goog.declareModuleId('os.ui.wiz.step.AbstractWizardStep');

import IWizardStep from './iwizardstep.js';// eslint-disable-line
import WizardStepEvent from './wizardstepevent.js';

const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');


/**
 * Base wizard step implementation. This implements the base activate behavior that will compile the step
 * template and add it to a parent, and deactivate behavior to clean up the step directive. It also tracks
 * step validity events fired as a result of internal validity changes (parsing errors, form validation changes,
 * etc). Event-based changes to validity also apply the wizard scope immediately. Step directives are responsible
 * for firing these events when necessary.
 *
 * @implements {IWizardStep<T>}
 * @template T
 */
export default class AbstractWizardStep {
  /**
   * Constructor.
   * @param {angular.$compile=} opt_compile Angular compile function
   */
  constructor(opt_compile) {
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
     * @type {Logger}
     * @protected
     */
    this.log = logger;
  }

  /**
   * Handles validity changes on the step scope.
   *
   * @param {angular.Scope.Event} event
   * @param {boolean=} opt_valid
   * @private
   */
  onStepValidityChange_(event, opt_valid) {
    if (opt_valid !== undefined) {
      this.valid = opt_valid;
    }
  }

  /**
   * @inheritDoc
   */
  activate(config, opt_scope, opt_parent) {
    this.initialize(config);

    if (opt_scope && opt_parent) {
      this.scope = opt_scope;
      this.scope['step'] = this;
      this.scope.$on(WizardStepEvent.VALIDATE, this.onStepValidityChange_.bind(this));

      var compile = this.compile_ || opt_parent.injector().get('$compile');
      var template = this.getTemplate();
      if (compile && template) {
        opt_parent.html(template);
        this.element = compile(opt_parent.contents())(opt_scope);
      }
    }

    this.deactivated = false;
  }

  /**
   * @inheritDoc
   */
  deactivate(config) {
    if (config != undefined) {
      this.finalize(config);
    }

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
  }

  /**
   * Initializes the wizard step from the provided configuration.
   *
   * @param {T} config The wizard configuration.
   */
  initialize(config) {
    this.initialized = true;
  }

  /**
   * Perform actions against the wizard configuration before the next step.
   *
   * @param {T} config The wizard configuration.
   */
  finalize(config) {
    // intended for overriding classes
  }

  /**
   * @inheritDoc
   */
  getTemplate() {
    return this.template;
  }

  /**
   * @inheritDoc
   * @export
   */
  getTitle() {
    return this.title;
  }

  /**
   * @inheritDoc
   */
  isCompiled() {
    return this.scope != null;
  }

  /**
   * @inheritDoc
   */
  isDeactivated() {
    return this.deactivated;
  }

  /**
   * @inheritDoc
   */
  isValid(config) {
    return this.valid;
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.wiz.step.AbstractWizardStep');
