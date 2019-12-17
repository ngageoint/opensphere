goog.module('os.MyClass');
goog.module.declareLegacyNamespace();

const MyParentClass = goog.require('os.MyParentClass');

/**
 * Description of the class.
 */
class MyClass extends MyParentClass {
  /**
   * @param {string} arg1 A string arg.
   * @param {number} arg2 A number arg.
   */
  constructor(arg1, arg2) {
    super(arg1);

    /**
     * Description of arg2.
     * @type {number}
     * @private
     */
    this.arg2_ = arg2;
  }

  /**
   * @inheritDoc
   */
  setArg1(arg1) {
    super.setArg1(arg1);
    console.log('Set arg1 in parent.');
  }
}

exports = MyClass;
