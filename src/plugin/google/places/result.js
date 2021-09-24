goog.declareModuleId('plugin.google.places.Result');

const CoordinateResult = goog.require('os.ui.search.place.CoordinateResult');
const {directiveTag: resultCardEl} = goog.require('plugin.google.places.ResultCardUI');


/**
 */
export default class Result extends CoordinateResult {
  /**
   * Constructor.
   * @param {ol.Feature} result
   */
  constructor(result) {
    super(result, 'name');
    this.score = 95;
  }

  /**
   * @inheritDoc
   */
  getSearchUI() {
    return `<${resultCardEl} result="result"></${resultCardEl}>`;
  }
}
