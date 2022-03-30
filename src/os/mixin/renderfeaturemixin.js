goog.declareModuleId('os.mixin.renderfeature');

import RenderFeature from 'ol/src/render/Feature.js';

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

  Object.defineProperties(RenderFeature.prototype, {
    values_: {
      get:
         /**
          * @return {Object}
          * @this {RenderFeature}
          * @suppress {accessControls}
          */
         function() {
           return this.properties_;
         }
    }
  });
};

init();
