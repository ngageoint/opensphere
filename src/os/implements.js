/**
 * @fileoverview
 *
 * Handle 'instanceof' for interfaces.  The reserved word 'instanceof' in Javascript only recognizes extends
 * and not implements.  This utility provides a way for declaring that a class implements an interface, and a way to
 * check if an instance is an implementation of an interface.
 *
 * To use:
 * 1. Declare an ID on the interface.  The Closure compiler throws away the guts of an interface at runtime.  This ID
 *    will remain and is used to reference the interface after everything else is gone.
 *
 *    e.g.: os.fun.IFlyingToy.ID = 'os.fun.IFlyingToy';
 *
 * 2. Register your implementing class with the interface.  This lets the application know at runtime which classes
 *    implement which interfaces, similar to goog.inherits().
 *
 *    e.g.: os.implements(myapp.HoverCraft, os.fun.IFlyingToy.ID);
 *
 * 3. When needed, you can test if a variable represents a implementation of the interface.
 *
 *   e.g.: var isFun = os.implements(myToy, os.fun.IFlyingToy.ID);
 */
goog.provide('os.implements');


/**
 * Prototype key to store implementations.
 * @type {string}
 * @const
 */
os.IMPLEMENTS_KEY = 'os_impls';


/**
 * Dual purpose function to set implements or ask if a thing implements an interface.
 * @param {*} value The value to test. If a function is provided, marks the function as implementing an interface.
 *      If an object is provided, returns if the object implements the interface. All other values return false.
 * @param {!string} interfaceId
 * @return {boolean} If the value implements the interface
 */
os.implements = function(value, interfaceId) {
  if (value != null) {
    var type = goog.typeOf(value);
    if (type === 'function') {
      os.addImplements_(/** @type {!Function} */ (value), interfaceId);
      return true;
    } else if (type === 'object') {
      return os.getImplements_(/** @type {!Object} */ (value), interfaceId);
    }
  }

  return false;
};


/**
 * Add interface ID to the class to indicate it implements
 * @param {!Function} clazz The constructor
 * @param {!string} interfaceId The interface id
 * @private
 */
os.addImplements_ = function(clazz, interfaceId) {
  var impls;
  if (clazz.prototype.hasOwnProperty(os.IMPLEMENTS_KEY)) {
    // property already exists directly on the prototype
    impls = clazz.prototype[os.IMPLEMENTS_KEY];
  } else {
    // property doesn't exist, or is inherited from another prototype
    impls = clazz.prototype[os.IMPLEMENTS_KEY] = [];
  }

  impls.push(interfaceId);
};


/**
 * Determine if an instance of an object implements the provided interface
 * @param {!Object} inst The object instance
 * @param {!string} interfaceId The interface id
 * @return {boolean} If the instance implements the interface
 * @private
 */
os.getImplements_ = function(inst, interfaceId) {
  // search the prototype chain for the interface id
  var proto = Object.getPrototypeOf(inst);
  while (proto) {
    if (proto[os.IMPLEMENTS_KEY] && proto[os.IMPLEMENTS_KEY].length &&
        proto[os.IMPLEMENTS_KEY].indexOf(interfaceId) >= 0) {
      return true;
    }

    proto = Object.getPrototypeOf(proto);
  }

  return false;
};
