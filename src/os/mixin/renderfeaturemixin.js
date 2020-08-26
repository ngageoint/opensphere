goog.provide('os.mixin.renderfeature');

goog.require('ol.render.Feature');

Object.defineProperties(ol.render.Feature.prototype, {
  values_: {
    get:
      /**
       * @return {Object}
       * @this {ol.render.Feature}
       * @suppress {accessControls}
       */
      function() {
        return this.properties_;
      }
  }
});
