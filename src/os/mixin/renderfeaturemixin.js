goog.module('os.mixin.renderfeature');

const RenderFeature = goog.require('ol.render.Feature');

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
