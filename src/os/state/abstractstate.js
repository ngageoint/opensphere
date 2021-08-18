goog.module('os.state.AbstractState');
goog.module.declareLegacyNamespace();

const Deferred = goog.require('goog.async.Deferred');
const {ID_SEPARATOR, stateToString} = goog.require('os.state');
const IState = goog.require('os.state.IState'); // eslint-disable-line
const Tag = goog.require('os.state.Tag');


/**
 * @abstract
 * @implements {IState<T, S>}
 * @unrestricted
 * @template T,S
 */
class AbstractState {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {Deferred}
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
     * @type {boolean}
     */
    this['supported'] = true;

    /**
     * @type {number}
     * @protected
     */
    this.priority = 0;

    /**
     * @type {?Object<string, string>}
     * @protected
     */
    this.rootAttrs = null;

    /**
     * @type {string}
     * @protected
     */
    this.rootName = Tag.STATE;

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
  }

  /**
   * @inheritDoc
   */
  getSupported() {
    return this['supported'];
  }

  /**
   * @inheritDoc
   */
  setSupported(value) {
    this['supported'] = value;
  }

  /**
   * @inheritDoc
   */
  getEnabled() {
    return this['enabled'];
  }

  /**
   * @inheritDoc
   */
  setEnabled(value) {
    this['enabled'] = value;
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return this.title;
  }

  /**
   * @inheritDoc
   */
  getDescription() {
    return this.description;
  }

  /**
   * @inheritDoc
   */
  getRootAttrs() {
    return this.rootAttrs;
  }

  /**
   * @inheritDoc
   */
  getRootName() {
    return this.rootName;
  }

  /**
   * @inheritDoc
   */
  getSavedState() {
    return this.savedState;
  }

  /**
   * @inheritDoc
   */
  getPriority() {
    return this.priority;
  }

  /**
   * @inheritDoc
   */
  save(options) {
    if (this.deferred && !this.deferred.hasFired()) {
      this.deferred.cancel(true);
    }

    this.deferred = new Deferred();
    this.saveInternal(options, this.createRoot(options));

    return this.deferred;
  }

  /**
   * Create the root object for the saved state.
   *
   * @abstract
   * @param {S} options The save options
   * @return {T}
   * @protected
   */
  createRoot(options) {}

  /**
   * Subclasses can call this method to set the savedState to the given value and fire the deferred callback to notify
   * consumers. Passing a null value is valid if the state could not be saved.
   *
   * @param {S} options The save options
   * @param {?T} rootObj The root XML node for this state.
   * @protected
   */
  saveComplete(options, rootObj) {
    this.savedState = rootObj;

    if (this.deferred) {
      this.deferred.callback(options);
    }
  }

  /**
   * Subclasses can call this method if the state save failed.
   *
   * @param {string} errorMsg The failure message
   * @protected
   */
  saveFailed(errorMsg) {
    if (this.deferred) {
      this.deferred.errback(errorMsg);
    }
  }

  /**
   * Subclasses should implement this method to perform the save operation.
   *
   * @abstract
   * @param {S} options The save options
   * @param {!T} rootObj The root XML node for this state.
   * @protected
   */
  saveInternal(options, rootObj) {}

  /**
   * Get the source for the provided node
   *
   * @abstract
   * @param {T} node The node
   * @return {?string} The source
   * @protected
   */
  getSource(node) {}

  /**
   * @return {string} String representation of the state
   * @override
   */
  toString() {
    // this is in a utility function to keep it next to {@link os.state.serializeTag}, in case someone decides to
    // change one of them
    return stateToString(this);
  }

  /**
   * @abstract
   * @inheritDoc
   */
  load(obj, id, opt_title) {}

  /**
   * @abstract
   * @inheritDoc
   */
  remove(id) {}

  /**
   * Create a layer id for a state file
   *
   * @param {string} stateId The state id
   * @param {string} layerId The base layer id
   * @return {string} The id for the loaded layer
   */
  static createId(stateId, layerId) {
    var newId = stateId + layerId;
    var parts = newId.split(ID_SEPARATOR);

    if (parts.length > 3) {
      var newParts = [];
      newParts[0] = parts.shift();
      newParts[2] = parts.pop();
      newParts[1] = parts.join('-');

      newId = newParts.join(ID_SEPARATOR);
    }

    return newId;
  }
}

exports = AbstractState;
