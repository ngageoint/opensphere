goog.provide('os.state.JSONState');
goog.require('os.state');
goog.require('os.state.AbstractState');
goog.require('os.state.JSONStateOptions');



/**
 * Base class for JSON states.
 * @extends {os.state.AbstractState.<!Object.<string, *>, os.state.JSONStateOptions>}
 * @constructor
 */
os.state.JSONState = function() {
  os.state.JSONState.base(this, 'constructor');
};
goog.inherits(os.state.JSONState, os.state.AbstractState);


/**
 * @inheritDoc
 */
os.state.JSONState.prototype.createRoot = function(options) {
  var rootObj = {};
  if (this.rootAttrs) {
    os.object.merge(this.rootAttrs, rootObj, false);
  }

  return rootObj;
};


/**
 * @inheritDoc
 */
os.state.JSONState.prototype.getSource = function(obj) {
  // TODO: support this if the application that created the state file is required. we may have to pass the root object
  // to the load function so it can be used here. objects can't walk up to the parent like XML elements can.
  return null;
};


/**
 * @inheritDoc
 */
os.state.JSONState.prototype.saveComplete = function(options, rootObj) {
  if (!options.obj[os.state.Tag.STATE]) {
    options.obj[os.state.Tag.STATE] = [];
  }
  rootObj[os.state.Tag.TYPE] = this.rootName;
  options.obj[os.state.Tag.STATE].push(rootObj);

  os.state.JSONState.base(this, 'saveComplete', options, rootObj);
};
