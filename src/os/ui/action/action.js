goog.module('os.ui.action.Action');

const Disposable = goog.require('goog.Disposable');

const GoogEvent = goog.requireType('goog.events.Event');
const MenuOptions = goog.requireType('os.ui.action.MenuOptions');


/**
 * Action is a simple value class that represents a direction the user gives
 * to the application through the UI.  An action might have multiple
 * paths of invocation, classically an item in a menu bar, a context/right
 * click menu item, and a shortcut key.  An action invocation commences by
 * dispatching its particular event type from a global event dispatcher,
 * whereupon one more interested listeners will respond to implement the action.
 *
 * @deprecated Please use {@link os.ui.menu.Menu} and {@link os.ui.menu.MenuItem} instead
 *
 * @todo factory function to create actions from commands
 * @todo namespaces for plugins, etc.
 * @todo add invocation context object in constructor and/or invoke method?
 * @todo support for including the DOM event that activated the action?
 * @todo support dispatching from other targets, e.g. toolbar, menus, etc?
 * @todo support capture/bubble phase and preventDefault()?
 */
class Action extends Disposable {
  /**
   * Constructor.
   * @param {!string} eventType the type of event the action will dispatch
   * @param {?string=} opt_title the title of the action
   * @param {?string=} opt_description the description of the action
   * @param {?string=} opt_icon the style name of the action's icon
   * @param {?string=} opt_hotkey the keyboard shortcut to invoke this action
   * @param {?MenuOptions=} opt_menuOptions Options for displaying this action in a menu
   * @param {?string=} opt_metricKey metric key value for the action
   */
  constructor(eventType, opt_title, opt_description, opt_icon, opt_hotkey, opt_menuOptions, opt_metricKey) {
    super();

    /**
     * @type {!string}
     * @private
     */
    this.eventType_ = eventType;

    /**
     * @type {!string}
     * @private
     */
    this.title_ = opt_title || eventType;

    /**
     * @type {?string}
     * @private
     */
    this.description_ = opt_description || opt_title || eventType;

    /**
     * @type {?string}
     * @private
     */
    this.icon_ = opt_icon || null;

    /**
     * @type {?string}
     * @private
     */
    this.hotkey_ = opt_hotkey || null;

    /**
     * @type {?MenuOptions}
     * @private
     */
    this.menuOptions_ = opt_menuOptions || null;

    /**
     * @type {?function(this:Action, ?):boolean}
     * @private
     */
    this.isEnabled_ = null;

    /**
     * @type {?function(this:Action, ?):boolean}
     * @private
     */
    this.activeCheckFunc_ = null;

    /**
     * @type {boolean}
     */
    this.isActive = true;

    /**
     * @type {?string}
     * @private
     */
    this.inactiveTooltip_ = null;

    /**
     * @type {?function(GoogEvent=):boolean|function(GoogEvent=)}
     * @private
     */
    this.handler_ = null;

    /**
     * metric value associated wtih this action.
     * @type {?string}
     * @private
     */
    this.metricKey_ = opt_metricKey || null;

    /**
     * controls the default close when clicked behavior
     * @type {boolean}
     */
    this.doNotCloseOnInvoke = false;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.description_ = null;
    this.icon_ = null;
    this.hotkey_ = null;
    this.isEnabled_ = null;
    this.handler_ = null;
    this.metricKey_ = null;
  }

  /**
   * Return the event type that invokes this action.
   *
   * @return {!string}
   * @export
   */
  getEventType() {
    return this.eventType_;
  }

  /**
   * Return the metricKey associated with this acation.
   *
   * @return {?string}
   * @export
   */
  getMetricKey() {
    return this.metricKey_;
  }

  /**
   * Return a short length of text that represents the action to the user.
   *
   * @return {!string}
   * @export
   */
  getTitle() {
    return this.title_;
  }

  /**
   * Return a style name that displays an icon for this action.
   *
   * @return {?string}
   * @export
   */
  getIcon() {
    return this.icon_;
  }

  /**
   * Return a style name that displays an icon for this action.
   *
   * @param {string} icon
   * @export
   */
  setIcon(icon) {
    this.icon_ = icon;
  }

  /**
   * Return a keyboard shortcut to invoke this action.
   *
   * @return {?string}
   * @export
   */
  getHotkey() {
    return this.hotkey_;
  }

  /**
   * Return a more detailed description of the action intended for a tooltip, help pop-up, etc.
   *
   * @return {?string}
   * @export
   */
  getDescription() {
    return (!this.isActive && this.inactiveTooltip_ != null) ? this.inactiveTooltip_ : this.description_;
  }

  /**
   * Set the function that determines whether this action is enabled.  The Action passes itself as the context
   * when calling the function.
   *
   * @param {function(this:Action, ?):boolean} isEnabled
   * @return {Action} this action
   */
  enableWhen(isEnabled) {
    this.isEnabled_ = isEnabled || null;
    return this;
  }

  /**
   * Set the function that determines whether this action is active.  The Action passes itself as the context
   * when calling the function.
   *
   * @param {function(this:Action, ?):boolean} activeCheckFunc
   * @param {string=} opt_inactiveTooltip
   * @return {Action} this action
   */
  activeWhen(activeCheckFunc, opt_inactiveTooltip) {
    this.activeCheckFunc_ = activeCheckFunc || null;
    this.inactiveTooltip_ = opt_inactiveTooltip || null;
    return this;
  }

  /**
   * Set the function that will handle the action event for this Action.
   *
   * @param {function(GoogEvent=):boolean|function(GoogEvent=)} handler the action event handler function
   * @return {Action} this
   */
  handleWith(handler) {
    this.handler_ = handler || null;
    return this;
  }

  /**
   * Return whether this action is currently enabled.  If a function was given to enableWhen(), this method calls
   * that function using this Action as the context.
   *
   * @param {*=} opt_actionArgs the action arguments to test
   * @return {boolean}
   */
  isEnabled(opt_actionArgs) {
    if (this.activeCheckFunc_ != null) {
      this.isActive = this.activeCheckFunc_.apply(this, arguments);
    } else {
      this.isActive = true;
    }

    if (this.isEnabled_ !== null) {
      return this.isEnabled_.apply(this, arguments);
    }
    return true;
  }

  /**
   * Return the default action event handler for this action.
   *
   * @return {?function(GoogEvent=):boolean|function(GoogEvent=)}
   */
  getHandler() {
    return this.handler_;
  }

  /**
   * Return the menu options which define how this action should be displayed in a menu.
   *
   * @return {?MenuOptions}
   */
  getMenuOptions() {
    return this.menuOptions_;
  }
}

exports = Action;
