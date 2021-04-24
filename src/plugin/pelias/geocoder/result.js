goog.module('plugin.pelias.geocoder.Result');

const CoordinateResult = goog.require('os.ui.search.place.CoordinateResult');
const {directiveTag: resultCardEl} = goog.require('plugin.pelias.geocoder.ResultCardUI');


/**
 */
class Result extends CoordinateResult {
  /**
   * Constructor.
   * @param {ol.Feature} result
   */
  constructor(result) {
    super(result, 'name');
    this.score = 95 + /** @type {number} */ (result.get('confidence'));
  }

  /**
   * @inheritDoc
   */
  getSearchUI() {
    return `<${resultCardEl} result="result"></${resultCardEl}>`;
  }
}

exports = Result;
