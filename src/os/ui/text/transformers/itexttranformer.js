goog.provide('os.ui.text.transformer.ITextTransformer');


/**
 * @interface
 */
os.ui.text.transformer.ITextTransformer = function() {};


/**
 * Test the text for patterns to replace
 * @param {string} text
 * @return {boolean}
 */
os.ui.text.transformer.ITextTransformer.prototype.test;


/**
 * Transform the text
 * @param {string} text
 * @return {string}
 */
os.ui.text.transformer.ITextTransformer.prototype.transform;
