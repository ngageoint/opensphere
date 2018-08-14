goog.provide('plugin.descriptor.DescriptorResult');
goog.require('os.search.AbstractSearchResult');
goog.require('plugin.descriptor.descriptorResultCardDirective');



/**
 * @param {!os.data.IDataDescriptor} result
 * @param {number} score
 * @param {number=} opt_count The number of features available in the layer.
 * @extends {os.search.AbstractSearchResult<!os.data.IDataDescriptor>}
 * @constructor
 */
plugin.descriptor.DescriptorResult = function(result, score, opt_count) {
  plugin.descriptor.DescriptorResult.base(this, 'constructor', result, score);

  /**
   * The feature count from elastic.
   * @type {number|undefined}
   */
  this.featureCount = opt_count;
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
