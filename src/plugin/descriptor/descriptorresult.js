goog.provide('plugin.descriptor.DescriptorResult');
goog.require('os.search.AbstractSearchResult');
goog.require('plugin.descriptor.descriptorResultCardDirective');



/**
 * @param {!os.data.IDataDescriptor} result
 * @param {number} score
 * @extends {os.search.AbstractSearchResult<!os.data.IDataDescriptor>}
 * @constructor
 */
plugin.descriptor.DescriptorResult = function(result, score) {
  plugin.descriptor.DescriptorResult.base(this, 'constructor', result, score);
};
goog.inherits(plugin.descriptor.DescriptorResult, os.search.AbstractSearchResult);


/**
 * @inheritDoc
 */
plugin.descriptor.DescriptorResult.prototype.getSearchUI = function() {
  return '<descriptorresultcard result="result"></descriptorresultcard>';
};


/**
 * @inheritDoc
 */
plugin.descriptor.DescriptorResult.prototype.performAction = function() {
  return false;
};
