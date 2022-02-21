goog.declareModuleId('plugin.descriptor.DescriptorResult');

import AbstractSearchResult from '../../os/search/abstractsearchresult.js';
import {directiveTag as cardUi} from './descriptorresultcard.js';

/**
 * Descriptor search result.
 * @extends {AbstractSearchResult<!IDataDescriptor>}
 */
export default class DescriptorResult extends AbstractSearchResult {
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
