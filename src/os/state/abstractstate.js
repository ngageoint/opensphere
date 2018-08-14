goog.provide('os.state.AbstractState');
goog.require('goog.async.Deferred');
goog.require('os.state');
goog.require('os.state.IState');
goog.require('os.state.Tag');



/**
 * @implements {os.state.IState.<T, S>}
 * @constructor
 * @template T,S
 */
os.state.AbstractState = function() {
  /**
   * @type {goog.async.Deferred}
   * @protected
   */
  this.deferred = null;

  /**
   * @type {string}
   * @protected
   */
  this.description = '';

  /**
   * This is exposed so it can be directly manipulated by the view
   * @type {boolean}
   */
  this['enabled'] = true;

  /**
   * @type {number}
   * @protected
   */
  this.priority = 0;

  /**
   * @type {?Object.<string, string>}
   * @protected
   */
  this.rootAttrs = null;

  /**
   * @type {string}
   * @protected
   */
  this.rootName = os.state.Tag.STATE;

  /**
   * @type {T}
   * @protected
   */
  this.savedState = null;

  /**
   * @type {string}
   * @protected
   */
  this.title = '';
};


/**
 * @inheritDoc
 */
os.state.AbstractState.prototype.getEnabled = function() {
  return this['enabled'];
};


/**
 * @inheritDoc
 */
os.state.AbstractState.prototype.setEnabled = function(value) {
  this['enabled'] = value;
};


/**
 * @inheritDoc
 */
os.state.AbstractState.prototype.getTitle = function() {
  return this.title;
};


/**
 * @inheritDoc
 */
os.state.AbstractState.prototype.getDescription = function() {
  return this.description;
};


/**
 * @inheritDoc
 */
os.state.AbstractState.prototype.getRootAttrs = function() {
  return this.rootAttrs;
};


/**
 * @inheritDoc
 */
os.state.AbstractState.prototype.getRootName = function() {
  return this.rootName;
};


/**
 * @inheritDoc
 */
os.state.AbstractState.prototype.getSavedState = function() {
  return this.savedState;
};


/**
 * @inheritDoc
 */
os.state.AbstractState.prototype.getPriority = function() {
  return this.priority;
};


/**
 * @inheritDoc
 */
os.state.AbstractState.prototype.save = function(options) {
  if (this.deferred && !this.deferred.hasFired()) {
    this.deferred.cancel(true);
  }

  this.deferred = new goog.async.Deferred();
  this.saveInternal(options, this.createRoot(options));

  return this.deferred;
};


/**
 * Create the root object for the saved state.
 * @param {S} options The save options
 * @return {T}
 * @protected
 */
os.state.AbstractState.prototype.createRoot = goog.abstractMethod;


/**
 * Subclasses can call this method to set the savedState to the given value and fire the deferred callback to notify
 * consumers. Passing a null value is valid if the state could not be saved.
 * @param {S} options The save options
 * @param {?T} rootObj The root XML node for this state.
 * @protected
 */
os.state.AbstractState.prototype.saveComplete = function(options, rootObj) {
  this.savedState = rootObj;

  if (this.deferred) {
    this.deferred.callback(options);
  }
};


/**
 * Subclasses can call this method if the state save failed.
 * @param {string} errorMsg The failure message
 * @protected
 */
os.state.AbstractState.prototype.saveFailed = function(errorMsg) {
  if (this.deferred) {
    this.deferred.errback(errorMsg);
  }
};


/**
 * Subclasses should implement this method to perform the save operation.
 * @param {S} options The save options
 * @param {!T} rootObj The root XML node for this state.
 * @protected
 */
os.state.AbstractState.prototype.saveInternal = goog.abstractMethod;


/**
 * Get the source for the provided node
 * @param {T} node The node
 * @return {?string} The source
 * @protected
 */
os.state.AbstractState.prototype.getSource = goog.abstractMethod;


/**
 * @return {string} String representation of the state
 * @override
 */
os.state.AbstractState.prototype.toString = function() {
  // this is in a utility function to keep it next to {@link os.state.serializeTag}, in case someone decides to
  // change one of them
  return os.state.stateToString(this);
};


/**
 * @inheritDoc
 */
os.state.AbstractState.prototype.load = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.state.AbstractState.prototype.remove = goog.abstractMethod;


/**
 * Create a layer id for a state file
 * @param {string} stateId The state id
 * @param {string} layerId The base layer id
 * @return {string} The id for the loaded layer
 */
os.state.AbstractState.createId = function(stateId, layerId) {
  var newId = stateId + layerId;
  var parts = newId.split(os.state.ID_SEPARATOR);

  if (parts.length > 3) {
    var newParts = [];
    newParts[0] = parts.shift();
    newParts[2] = parts.pop();
    newParts[1] = parts.join('-');

    newId = newParts.join(os.state.ID_SEPARATOR);
  }

  return newId;
};
