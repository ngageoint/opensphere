goog.provide('os.ui.text.transformer.DashesTransformer');

goog.require('os.ui.text.transformer.ITextTransformer');
goog.require('os.ui.text.transformer.TextTransformerManager');


/**
 * @implements {os.ui.text.transformer.ITextTransformer}
 * @constructor
 */
os.ui.text.transformer.DashesTransformer = function() {
  /**
   * @type {Object<string, RegExp>}
   * @private
   */
  this.dashesMap_ = {
    '-': /[\u002d\u058a\u05be\u2011\u2012\u2013\u2014\u2015\u2e3a\u2e3b\uff0d]/g
  };
};
goog.addSingletonGetter(os.ui.text.transformer.DashesTransformer);


/**
 * @inheritDoc
 */
os.ui.text.transformer.DashesTransformer.prototype.test = function(text) {
  for (const key in this.dashesMap_) {
    if (text.match(this.dashesMap_[key])) {
      return true;
    }
  }
  return false;
};


/**
 * @inheritDoc
 */
os.ui.text.transformer.DashesTransformer.prototype.transform = function(text) {
  for (const key in this.dashesMap_) {
    text = text.replace(this.dashesMap_[key], key);
  }
  return text;
};
