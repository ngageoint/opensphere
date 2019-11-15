goog.provide('os.ui.text.transformer.TextTransformerManager');

goog.require('os.ui.text.transformer.ITextTransformer');


/**
 * @constructor
 */
os.ui.text.transformer.TextTransformerManager = function() {
  /**
   * @type {Object<string, !os.ui.text.transformer.ITextTransformer>}
   * @private
   */
  this.textTransformers_ = {};
};
goog.addSingletonGetter(os.ui.text.transformer.TextTransformerManager);


/**
 * @param {string} name
 * @param {!os.ui.text.transformer.ITextTransformer} textTransformers
 */
os.ui.text.transformer.TextTransformerManager.prototype.registerTextTransformer = function(name, textTransformers) {
  this.textTransformers_[name] = textTransformers;
};


/**
 * @param {string} name
 * @return {?os.ui.text.transformer.ITextTransformer}
 */
os.ui.text.transformer.TextTransformerManager.prototype.getTextTransformer = function(name) {
  return this.textTransformers_[name];
};


/**
 * @param {Array<string>=} opt_names
 * @return {!Array<!os.ui.text.transformer.ITextTransformer>}
 */
os.ui.text.transformer.TextTransformerManager.prototype.getTextTransformers = function(opt_names) {
  const transformers = [];
  if (opt_names) {
    opt_names.forEach((name) => {
      const transformer = this.textTransformers_[name];
      if (transformer) {
        transformers.push(this.textTransformers_[name]);
      }
    });
  } else {
    for (const name in this.textTransformers_) {
      transformers.push(this.textTransformers_[name]);
    }
  }
  return transformers;
};
