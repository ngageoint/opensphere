goog.provide('os.ui.action.Action');
goog.require('goog.Disposable');
goog.require('os.ui.action.MenuOptions');



/**
 * Action is a simple value class that represents a direction the user gives
 * to the application through the UI.  An action might have multiple
 * paths of invocation, classically an item in a menu bar, a context/right
 * click menu item, and a shortcut key.  An action invocation commences by
 * dispatching its particular event type from a global event dispatcher,
 * whereupon one more interested listeners will respond to implement the action.
 *
 * @param {!string} eventType the type of event the action will dispatch
 * @param {?string=} opt_title the title of the action
 * @param {?string=} opt_description the description of the action
 * @param {?string=} opt_icon the style name of the action's icon
 * @param {?string=} opt_hotkey the keyboard shortcut to invoke this action
 * @param {?os.ui.action.MenuOptions=} opt_menuOptions Options for displaying this action in a menu
 * @param {?string=} opt_metricKey metric key value for the action
 * @extends {goog.Disposable}
 * @constructor
 * @deprecated Please use {@link os.ui.menu.Menu} and {@link os.ui.menu.MenuItem} instead
 *
 * @todo factory function to create actions from commands
 * @todo namespaces for plugins, etc.
 * @todo add invocation context object in constructor and/or invoke method?
 * @todo support for including the DOM event that activated the action?
 * @todo support dispatching from other targets, e.g. toolbar, menus, etc?
 * @todo support capture/bubble phase and preventDefault()?
 */
os.ui.action.Action = function(eventType, opt_title, opt_description, opt_icon, opt_hotkey,
        opt_menuOptions, opt_metricKey) {
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
   * @type {?os.ui.action.MenuOptions}
   * @private
   */
  this.menuOptions_ = opt_menuOptions || null;

  /**
   * @type {?function(this:os.ui.action.Action, ?):boolean}
   * @private
   */
  this.isEnabled_ = null;

  /**
   * @type {?function(goog.events.Event=):boolean|function(goog.events.Event=)}
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
};
goog.inherits(os.ui.action.Action, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.action.Action.prototype.disposeInternal = function() {
  os.ui.action.Action.base(this, 'disposeInternal');

  this.description_ = null;
  this.icon_ = null;
  this.hotkey_ = null;
  this.group_ = null;
  this.isEnabled_ = null;
  this.handler_ = null;
  this.metricKey_ = null;
};


/**
 * Return the event type that invokes this action.
 *
 * @return {!string}
 */
os.ui.action.Action.prototype.getEventType = function() {
  return this.eventType_;
};
goog.exportProperty(os.ui.action.Action.prototype, 'getEventType', os.ui.action.Action.prototype.getEventType);


/**
 * Return the metricKey associated with this acation.
 *
 * @return {?string}
 */
os.ui.action.Action.prototype.getMetricKey = function() {
  return this.metricKey_;
};
goog.exportProperty(os.ui.action.Action.prototype, 'getMetricKey', os.ui.action.Action.prototype.getMetricKey);


/**
 * Return a short length of text that represents the action to the user.
 *
 * @return {!string}
 */
os.ui.action.Action.prototype.getTitle = function() {
  return this.title_;
};
goog.exportProperty(os.ui.action.Action.prototype, 'getTitle', os.ui.action.Action.prototype.getTitle);


/**
 * Return a style name that displays an icon for this action.
 *
 * @return {?string}
 */
os.ui.action.Action.prototype.getIcon = function() {
  return this.icon_;
};
goog.exportProperty(os.ui.action.Action.prototype, 'getIcon', os.ui.action.Action.prototype.getIcon);


/**
 * Return a style name that displays an icon for this action.
 *
 * @param {string} icon
 */
os.ui.action.Action.prototype.setIcon = function(icon) {
  this.icon_ = icon;
};
goog.exportProperty(os.ui.action.Action.prototype, 'setIcon', os.ui.action.Action.prototype.setIcon);


/**
 * Return a keyboard shortcut to invoke this action.
 *
 * @return {?string}
 */
os.ui.action.Action.prototype.getHotkey = function() {
  return this.hotkey_;
};
goog.exportProperty(os.ui.action.Action.prototype, 'getHotkey', os.ui.action.Action.prototype.getHotkey);


/**
 * Return a more detailed description of the action intended for a tooltip, help pop-up, etc.
 *
 * @return {?string}
 */
os.ui.action.Action.prototype.getDescription = function() {
  return this.description_;
};
goog.exportProperty(os.ui.action.Action.prototype, 'getDescription', os.ui.action.Action.prototype.getDescription);


/**
 * Set the function that determines whether this action is enabled.  The Action passes itself as the context
 * when calling the function.
 *
 * @param {function(this:os.ui.action.Action, ?):boolean} isEnabled
 * @return {os.ui.action.Action} this action
 */
os.ui.action.Action.prototype.enableWhen = function(isEnabled) {
  this.isEnabled_ = isEnabled || null;
  return this;
};


/**
 * Set the function that will handle the action event for this Action.
 *
 * @param {function(goog.events.Event=):boolean|function(goog.events.Event=)} handler the action event handler function
 * @return {os.ui.action.Action} this
 */
os.ui.action.Action.prototype.handleWith = function(handler) {
  this.handler_ = handler || null;
  return this;
};


/**
 * Return whether this action is currently enabled.  If a function was given to enableWhen(), this method calls
 * that function using this Action as the context.
 *
 * @param {*=} opt_actionArgs the action arguments to test
 * @return {boolean}
 */
os.ui.action.Action.prototype.isEnabled = function(opt_actionArgs) {
  if (this.isEnabled_ !== null) {
    return this.isEnabled_.apply(this, arguments);
  }
  return true;
};


/**
 * Return the default action event handler for this action.
 *
 * @return {?function(goog.events.Event=):boolean|function(goog.events.Event=)}
 */
os.ui.action.Action.prototype.getHandler = function() {
  return this.handler_;
};


/**
 * Return the menu options which define how this action should be displayed in a menu.
 *
 * @return {?os.ui.action.MenuOptions}
 */
os.ui.action.Action.prototype.getMenuOptions = function() {
  return this.menuOptions_;
};
