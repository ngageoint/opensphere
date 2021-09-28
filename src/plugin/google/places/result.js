goog.declareModuleId('plugin.google.places.Result');

import {directiveTag as resultCardEl} from './resultcard.js';

const CoordinateResult = goog.require('os.ui.search.place.CoordinateResult');

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
