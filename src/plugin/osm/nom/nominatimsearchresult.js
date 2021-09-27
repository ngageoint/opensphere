goog.declareModuleId('plugin.osm.nom.SearchResult');

import * as style from '../../../os/style/style.js';
import CoordinateResult from '../../../os/ui/search/place/coordinateresult.js';
import {LABEL_FIELD, VECTOR_CONFIG, getSearchScore} from './nominatim.js';
import {directiveTag as resultCardEl} from './nominatimsearchresultcard.js';

const StyleType = goog.require('os.style.StyleType');


/**
 * Search result card for Nominatim results.
 */
export default class SearchResult extends CoordinateResult {
  /**
   * Constructor.
   * @param {ol.Feature} result The result feature.
   */
  constructor(result) {
    var score = getSearchScore(result);
    super(result, LABEL_FIELD, score);

    result.set(StyleType.FEATURE, VECTOR_CONFIG, true);
    style.setFeatureStyle(result);
  }

  /**
   * @inheritDoc
   */
  getSearchUI() {
    return `<${resultCardEl} result="result"></${resultCardEl}>`;
  }
}
