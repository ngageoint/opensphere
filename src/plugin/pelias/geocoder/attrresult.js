goog.declareModuleId('plugin.pelias.geocoder.AttrResult');

import AbstractSearchResult from '../../../os/search/abstractsearchresult.js';
import {directiveTag as attrCardEl} from './attrcard.js';

/**
 * HTML Attribution result for Google Places API
 *
 * @extends {AbstractSearchResult<Array<!string>>}
 */
export default class AttrResult extends AbstractSearchResult {
  /**
   * Constructor.
   * @param {Array<!string>} attributions
   */
  constructor(attributions) {
    super(attributions, 96);
  }

  /**
   * @inheritDoc
   */
  getSearchUI() {
    return `<${attrCardEl} result="result"></${attrCardEl}>`;
  }
}
