goog.provide('os.ol.mixin.Disposable');

goog.require('ol.Disposable');


/**
 * If the object has been disposed.
 * @return {boolean} If the object has been disposed.
 * @suppress {accessControls}
 */
ol.Disposable.prototype.isDisposed = function() {
  return this.disposed_;
};
