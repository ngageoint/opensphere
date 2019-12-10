goog.provide('os.MyClass');

goog.require('os.MyParentClass');

/**
 * Description of the class.
 * @param {string} arg1 A string arg.
 * @param {number} arg2 A number arg.
 * @extends {os.MyParentClass}
 * @constructor
 */
os.MyClass = function(arg1, arg2) {
  os.MyClass.base(this, 'constructor', arg1);

  /**
   * Description of arg2.
   * @type {number}
   * @private
   */
  this.arg2_ = arg2;
};
goog.inherits(os.MyClass, os.MyParentClass);

/**
 * @inheritDoc
 */
os.MyClass.prototype.setArg1 = function(arg1) {
  os.MyClass.base(this, 'setArg1', arg1);
  console.log('Set arg1 in parent.');
};
