goog.provide('os.ui.action.ActionManager');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.structs.LinkedMap');
goog.require('os.ui.action.Action');
goog.require('os.ui.action.ActionEvent');
goog.require('os.ui.action.EventType');



/**
 * ActionManager provides an interface for managing and invoking a set of related
 * os.ui.action.Action objects.
 *
 * Action listeners can listen to an ActionManager for events that invoke an action, as
 * well as events that notify listeners when actions are enabled or disabled.  Clients
 * can then build dynamic controls and menus based on the set of actions an ActionManager
 * provides.
 *
 * @extends {goog.events.EventTarget}
 * @constructor
 *
 * @todo support "capture phase" for action invocations?
 * @todo support action event groups so a single listener can handle several related actions?
 * @todo add a name/label to the action manager?
 * @deprecated Please use {@link os.ui.menu.Menu} and {@link os.ui.menu.MenuItem} instead
 */
os.ui.action.ActionManager = function() {
  os.ui.action.ActionManager.base(this, 'constructor');

  /**
   * @type {goog.structs.LinkedMap}
   * @private
   */
  this.actions_ = new goog.structs.LinkedMap();

  /**
   * @type {function():*|*}
   * @private
   */
  this.actionArgs_;

  /**
   * @type {function():*|*}
   * @private
   */
  this.actionTarget_;

  /**
   * @type {goog.structs.LinkedMap}
   * @private
   */
  this.enabledActions_ = new goog.structs.LinkedMap();

  /**
   * @type {Array<Function>}
   * @private
   */
  this.tempActions_ = [];

  /**
   * @type {function(angular.JQLite)}
   * @private
   */
  this.moreResultsAction_;
};
goog.inherits(os.ui.action.ActionManager, goog.events.EventTarget);


/**
 * @inheritDoc
 */
os.ui.action.ActionManager.prototype.disposeInternal = function() {
  var actions = this.actions_.getValues();
  for (var i = 0, n = actions.length; i < n; i++) {
    this.removeAction(actions[i], true);
  }

  os.ui.action.ActionManager.base(this, 'disposeInternal');
};


/**
 * A flag to detect infinite recursion in getActionArgs()
 *
 * @type {boolean}
 * @private
 */
os.ui.action.ActionManager.prototype.gettingActionArgs_;


/**
 * Set this ActionManager's current action arguments.  If x is a function, ActionManager.getActionArgs()
 * will call the function using itself as the context to obtain the current action arguments.  Therefore,
 * to avoid an infinite recursion, that function should not call ActionManager.getActionArgs().
 *
 * @param {!function(this:os.ui.action.ActionManager):*|*} x a function or object
 * @return {os.ui.action.ActionManager} this for chaining
 */
os.ui.action.ActionManager.prototype.withActionArgs = function(x) {
  this.actionArgs_ = x;
  return this;
};


/**
 * Get the current action arguments.
 *
 * @return {*}
 */
os.ui.action.ActionManager.prototype.getActionArgs = function() {
  if (!goog.isFunction(this.actionArgs_)) {
    return this.actionArgs_;
  }
  if (this.gettingActionArgs_) {
    throw new Error('illegal state: ActionManager.getActionArgs() infinite recursion');
  }
  this.gettingActionArgs_ = true;
  var result = this.actionArgs_.call(this);
  this.gettingActionArgs_ = false;
  return result;
};


/**
 * A flag to detect infinite recursion in getActionArgs()
 *
 * @type {boolean}
 * @private
 */
os.ui.action.ActionManager.prototype.gettingActionTarget_;


/**
 * Set this ActionManager's current action arguments.  If x is a function, ActionManager.getActionArgs()
 * will call the function using itself as the context to obtain the current action arguments.  Therefore,
 * to avoid an infinite recursion, that function should not call ActionManager.getActionArgs().
 *
 * @param {!function(this:os.ui.action.ActionManager):*|*} x a function or object
 * @return {os.ui.action.ActionManager} this for chaining
 */
os.ui.action.ActionManager.prototype.withActionTarget = function(x) {
  this.actionTarget_ = x;
  return this;
};


/**
 * Get the current action target.
 *
 * @return {*}
 */
os.ui.action.ActionManager.prototype.getActionTarget = function() {
  if (!goog.isFunction(this.actionTarget_)) {
    return this.actionTarget_;
  }
  if (this.gettingActionTarget_) {
    throw new Error('illegal state: ActionManager.getActionTarget() infinite recursion');
  }
  this.gettingActionTarget_ = true;
  var result = this.actionTarget_.call(this);
  this.gettingActionTarget_ = false;
  return result;
};


/**
 * Add the given action to this ActionManager.  If the action's event type is already
 * registered, the given action will replace the existing action.  The handler function
 * context will be the action object.  If the action has a default handler, given by
 * Action.getHandler(), opt_handler takes precedence over the action's handler.  If
 * the given action replaces an existing action, and the existing action had a default
 * handler, that handler will be removed from the list of listeners to this ActionManager.
 * All other listeners of the action's event type will remain.
 *
 * @param {os.ui.action.Action} action
 * @param {Function=} opt_handler an optional listener for the given action
 * @param {boolean=} opt_quiet optionally suppresses change events from firing upon add.
 */
os.ui.action.ActionManager.prototype.addAction = function(action, opt_handler, opt_quiet) {
  var existing = this.getAction(action.getEventType());
  /** @type {Function} */
  var existingHandler = existing ? existing.getHandler() : null;
  if (existing && existingHandler) {
    this.unlisten(action.getEventType(), existingHandler, false, existing);
  }
  this.actions_.set(action.getEventType(), action);
  if (action.isEnabled(this.getActionArgs())) {
    this.enabledActions_.set(action.getEventType(), action);
    if (!opt_quiet) {
      this.fireEnabledActionsChanged_();
    }
  }
  opt_handler = opt_handler || action.getHandler();
  if (opt_handler) {
    this.listen(action.getEventType(), opt_handler, false, action);
  }
};


/**
 * Bulk add actions.  Adds all of the actions before firing the change event.
 * Uses the handler on the action, with no option to provide optional handler.  Use the quiet flag on addAction if
 * you must provide an optional handler.
 * @param {!Array.<os.ui.action.Action>} actions
 */
os.ui.action.ActionManager.prototype.addActions = function(actions) {
  goog.array.forEach(actions, function(action) {
    this.addAction(action, null, true);
  }, this);
  this.fireEnabledActionsChanged_();
};


/**
 * Removes an action from the Action Manager. If it was enabled when it gets removed, it is
 * removed from the enabledActions_ map as well. The action object is also disposed.
 * @param {os.ui.action.Action|string} action
 * @param {boolean=} opt_quiet optionally suppress firing change event upon remove
 */
os.ui.action.ActionManager.prototype.removeAction = function(action, opt_quiet) {
  var existing = goog.isString(action) ? this.getAction(action) : action;
  if (existing) {
    var type = existing.getEventType();
    var existingHandler = existing.getHandler();
    if (existingHandler) {
      this.unlisten(type, existingHandler, false, existing);
    }

    this.actions_.remove(type);

    if (existing.isEnabled(this.getActionArgs())) {
      this.enabledActions_.remove(type);
      if (goog.isDefAndNotNull(opt_quiet) && !opt_quiet) {
        this.fireEnabledActionsChanged_();
      }
    }

    existing.dispose();
  }
};


/**
 * Bulk remove actions.  Removes all actions before firing the change event.
 * @param {Array<string>=} opt_types
 */
os.ui.action.ActionManager.prototype.removeActions = function(opt_types) {
  if (opt_types) {
    goog.array.forEach(opt_types, function(type) {
      this.removeAction(type, true);
    }, this);
  } else if (this.actions_) {
    var actions = this.actions_.getValues();
    for (var i = 0, n = actions.length; i < n; i++) {
      this.removeAction(actions[i], true);
    }
  }

  this.fireEnabledActionsChanged_();
};


/**
 * Refresh the enabled state of the registered actions.  If the enabled actions changed,
 * fire an ENABLED_ACTIONS_CHANGED event.
 *
 * @return {!Array.<!os.ui.action.Action>} the refreshed list of enabled actions
 */
os.ui.action.ActionManager.prototype.refreshEnabledActions = function() {
  var actionArgs = this.getActionArgs();
  var changed = false;

  // Call the temp actions generating functions
  if (this.tempActions_.length > 0) {
    this.tempActions_.forEach(function(fn) {
      fn(actionArgs);
    });
  }

  this.actions_.forEach(function(action) {
    if (action.isEnabled(actionArgs)) {
      if (!this.enabledActions_.containsKey(action.getEventType())) {
        this.enabledActions_.set(action.getEventType(), action);
        changed = true;
      } else {
        // push to the end of the list so the actions stay in the original order
        this.enabledActions_.remove(action.getEventType());
        this.enabledActions_.set(action.getEventType(), action);
      }
    } else {
      changed |= this.enabledActions_.remove(action.getEventType());
    }
  }, this);
  if (changed) {
    this.fireEnabledActionsChanged_();
  }
  return this.getEnabledActions();
};


/**
 * Get the list of currently enabled actions.
 *
 * @return {!Array.<!os.ui.action.Action>} a list of actions
 */
os.ui.action.ActionManager.prototype.getEnabledActions = function() {
  return this.enabledActions_.getValues();
};


/**
 * @return {boolean} true if this.getEnabledActions().length > 0, false otherwise
 */
os.ui.action.ActionManager.prototype.hasEnabledActions = function() {
  return this.getEnabledActions().length > 0;
};
goog.exportProperty(os.ui.action.ActionManager.prototype, 'hasEnabledActions',
    os.ui.action.ActionManager.prototype.hasEnabledActions);


/**
 * Return the action registered for the given event type.
 *
 * @param {string} eventType the event type of the desired action
 * @return {?os.ui.action.Action} the action or null
 */
os.ui.action.ActionManager.prototype.getAction = function(eventType) {
  return this.actions_.get(eventType) || null;
};


/**
 * Fire a goog.events.Event with the given action event type.  The action will not fire if
 * the action is disabled or the action is not registered to this ActionManager.
 *
 * @param {os.ui.action.Action|string} action the action to invoke
 * @return {boolean} true if the action was invoked, false otherwise
 */
os.ui.action.ActionManager.prototype.invoke = function(action) {
  if (goog.isString(action)) {
    action = this.getAction(action);
  }
  var args = this.getActionArgs();

  if (action && action.isEnabled(args)) {
    var evt = new os.ui.action.ActionEvent(action.getEventType(), args);
    this.dispatchEvent(evt);

    if (!evt.defaultPrevented) {
      os.dispatcher.dispatchEvent(evt);
    }

    return true;
  }
  return false;
};


/**
 * Fire a os.ui.action.EventType.ENABLED_ACTIONS_CHANGED event.
 *
 * @private
 */
os.ui.action.ActionManager.prototype.fireEnabledActionsChanged_ = function() {
  this.dispatchEvent(new goog.events.Event(
      os.ui.action.EventType.ENABLED_ACTIONS_CHANGED));
};


/**
 * Registers temp actions.
 * @param {Function} func
 */
os.ui.action.ActionManager.prototype.registerTempActionFunc = function(func) {
  this.tempActions_.push(func);
};

/**
 * Register the action to take if there are more actions than what will fit on
 * the screen.
 * @param {function(angular.JQLite)} func Function to call when the user clicks for more menu items
 */
os.ui.action.ActionManager.prototype.registerMoreResultsAction = function(func) {
  this.moreResultsAction_ = func;
};

/**
 * Invoke the action to take if there are more actions than what will fit on
 * the screen.
 * @param {angular.JQLite} menu Action menu that requires the more results action
 */
os.ui.action.ActionManager.prototype.invokeMoreResultsAction = function(menu) {
  this.moreResultsAction_(menu);
};
