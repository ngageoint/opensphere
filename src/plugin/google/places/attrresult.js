goog.module('plugin.google.places.AttrResult');

const AbstractSearchResult = goog.require('os.search.AbstractSearchResult');
const {directiveTag: attrCardEl} = goog.require('plugin.google.places.AttrCardUI');


/**
 * HTML Attribution result for Google Places API
 *
 * @extends {AbstractSearchResult<Array<!string>>}
 */
class AttrResult extends AbstractSearchResult {
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

exports = AttrResult;
