goog.module('plugin.osm.nom.SearchResult');

const style = goog.require('os.style');
const StyleType = goog.require('os.style.StyleType');
const CoordinateResult = goog.require('os.ui.search.place.CoordinateResult');
const {LABEL_FIELD, VECTOR_CONFIG, getSearchScore} = goog.require('plugin.osm.nom');
const {directiveTag: resultCardEl} = goog.require('plugin.osm.nom.ResultCardUI');


/**
 * Search result card for Nominatim results.
 */
class SearchResult extends CoordinateResult {
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

exports = SearchResult;
