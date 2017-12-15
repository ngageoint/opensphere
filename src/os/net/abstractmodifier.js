goog.provide('os.net.AbstractModifier');
goog.require('os.net.IModifier');



/**
 * @param {string} id Identifier for the modifier
 * @param {number=} opt_priority Priority of the modifier
 * @implements {os.net.IModifier}
 * @constructor
 */
os.net.AbstractModifier = function(id, opt_priority) {
  /**
   * @type {string}
   * @private
   */
  this.id_ = id;

  /**
   * @type {number}
   * @private
   */
  this.priority_ = goog.isDef(opt_priority) ? opt_priority : 0;
};


/**
 * @inheritDoc
 */
os.net.AbstractModifier.prototype.getId = function() {
  return this.id_;
};


/**
 * @inheritDoc
 */
os.net.AbstractModifier.prototype.setId = function(id) {
  this.id_ = id;
};


/**
 * @inheritDoc
 */
os.net.AbstractModifier.prototype.getPriority = function() {
  return this.priority_;
};


/**
 * @inheritDoc
 */
os.net.AbstractModifier.prototype.setPriority = function(priority) {
  this.priority_ = priority;
};


/**
 * @inheritDoc
 */
os.net.AbstractModifier.prototype.modify = goog.abstractMethod;
