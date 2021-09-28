goog.declareModuleId('os.mixin.fixInjectorInvoke');

/**
 * The isClass function in angular does not properly check
 * func.hasOwnProperty('$$ngIsClass'), resulting in incorrect
 * values for classes which extend an older ES5 class.
 *
 * Example:
 *
 *    var OldClass = function() {};
 *    OldClass.$$ngIsClass = false;
 *    class NewClass extends OldClass {};
 *    OldClass.$$ngIsClass // false! We need this to be true|undefined|null
 *
 * @param {Function|null|undefined} fn
 */
const fixNgIsClass = (fn) => {
  if (fn && typeof fn === 'function' && !fn.hasOwnProperty('$$ngIsClass')) {
    fn['$$ngIsClass'] = null;
  }
};

/**
 * @param {!angular.$injector} injector
 */
const fixInjectorInvoke = (injector) => {
  const oldInvoke = injector.invoke;
  injector.invoke = (input, self, locals, serviceName) => {
    const fn = Array.isArray(input) ? input[input.length - 1] : input;
    fixNgIsClass(fn);
    return oldInvoke(input, self, locals, serviceName);
  };
};

export default fixInjectorInvoke;
