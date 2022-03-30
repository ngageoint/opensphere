goog.declareModuleId('os.ol.mixin.Disposable');

import Disposable from 'ol/src/Disposable.js';


/**
 * If the mixin has been initialized.
 * @type {boolean}
 */
let initialized = false;

/**
 * Initialize the mixin.
 */
export const init = () => {
  if (initialized) {
    return;
  }

  initialized = true;

  /**
   * If the object has been disposed.
   *
   * @return {boolean} If the object has been disposed.
   * @suppress {accessControls}
   */
  Disposable.prototype.isDisposed = function() {
    return this.disposed;
  };
};

init();
