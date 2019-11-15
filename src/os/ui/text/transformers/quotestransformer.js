goog.provide('os.ui.text.transformer.QuotesTransformer');

goog.require('os.ui.text.transformer.ITextTransformer');
goog.require('os.ui.text.transformer.TextTransformerManager');


/**
 * @implements {os.ui.text.transformer.ITextTransformer}
 * @constructor
 */
os.ui.text.transformer.QuotesTransformer = function() {
  /**
   * @type {Object<string, RegExp>}
   * @private
   */
  this.quotesMap_ = {
    '\'': /[\u2018\u2019]/g,
    '"': /[\u201C\u201D]/g
  };
};
goog.addSingletonGetter(os.ui.text.transformer.QuotesTransformer);


/**
 * @inheritDoc
 */
os.ui.text.transformer.QuotesTransformer.prototype.test = function(text) {
  for (const key in this.quotesMap_) {
    if (text.match(this.quotesMap_[key])) {
      return true;
    }
  }
  return false;
};


/**
 * @inheritDoc
 */
os.ui.text.transformer.QuotesTransformer.prototype.transform = function(text) {
  for (const key in this.quotesMap_) {
    text = text.replace(this.quotesMap_[key], key);
  }
  return text;
};
