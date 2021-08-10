goog.module('os.ol.mixin.Disposable');
goog.module.declareLegacyNamespace();

const Disposable = goog.require('ol.Disposable');


/**
 * If the object has been disposed.
 *
 * @return {boolean} If the object has been disposed.
 * @suppress {accessControls}
 */
Disposable.prototype.isDisposed = function() {
  return this.disposed_;
};
