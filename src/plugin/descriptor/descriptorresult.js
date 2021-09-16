goog.module('plugin.descriptor.DescriptorResult');

const AbstractSearchResult = goog.require('os.search.AbstractSearchResult');
const {directiveTag: cardUi} = goog.require('plugin.descriptor.ResultCardUI');

const IDataDescriptor = goog.requireType('os.data.IDataDescriptor');


/**
 * Descriptor search result.
 * @extends {AbstractSearchResult<!IDataDescriptor>}
 */
class DescriptorResult extends AbstractSearchResult {
  /**
   * Constructor.
   * @param {!IDataDescriptor} result The descriptor.
   * @param {number} score The search score.
   * @param {number=} opt_count The number of features available in the layer.
   */
  constructor(result, score, opt_count) {
    super(result, score);

    /**
     * The feature count from elastic.
     * @type {number|undefined}
     */
    this.featureCount = opt_count;
  }

  /**
   * @inheritDoc
   */
  getSearchUI() {
    return `<${cardUi} result="result"></${cardUi}>`;
  }

  /**
   * @inheritDoc
   */
  performAction() {
    return false;
  }
}

exports = DescriptorResult;
