goog.declareModuleId('os.search.SearchTermFacet');

import TreeSearch from '../ui/slick/treesearch.js';
import BaseFacet from './basefacet.js';


/**
 * @extends {BaseFacet<T>}
 * @template T
 */
export default class SearchTermFacet extends BaseFacet {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {?RegExp}
     * @private
     */
    this.regex_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.term_ = null;
  }

  /**
   * @param {string} term
   */
  setTerm(term) {
    this.regex_ = null;
    this.term_ = null;

    if (term) {
      var pattern = TreeSearch.getPattern(term).replace(/\.\*/g, '');
      this.regex_ = new RegExp(pattern, 'gi');
      this.term_ = term;
    }
  }

  /**
   * @inheritDoc
   */
  load(item, facets) {
    // Don't show the search term facet
  }

  /**
   * @inheritDoc
   */
  test(item, facets, results) {
    if (this.regex_) {
      BaseFacet.updateResults('SearchTerm', results);

      var score = this.testInternal(item);
      if (score) {
        BaseFacet.updateResults('SearchTerm', results, score);
      }
    }
  }

  /**
   * Test a search item.
   * @param {T} item The search item.
   * @return {number} score The search score.
   * @template T
   */
  testInternal(item) {
    var texts = this.getTexts(item);
    var score = 0;
    for (var t = 0, m = texts.length; t < m; t++) {
      if (texts[t]) {
        score += this.getScore(this.regex_, texts[t], 10 * (t + 1));
      }
    }

    return score;
  }

  /**
   * Get the texts to search from the item.
   * @param {T} item The search item.
   * @return {!Array<string>} The texts to search.
   * @template T
   */
  getTexts(item) {
    return [];
  }

  /**
   * Get the terms from the search string. Terms are returned in lowercase, with duplicates removed.
   * @return {!Array<string>} The terms.
   * @protected
   */
  getTerms() {
    const terms = [];
    if (this.term_) {
      const termRegex = /[^\s"]+|"([^"]*)"/gi;
      let match = termRegex.exec(this.term_);
      while (match) {
        if (match) {
          // Index 1 in the array is the captured group if it exists
          // Index 0 is the matched text, which we use if no captured group exists
          // Don't allow empty terms.
          const term = (match[1] ? match[1] : match[0]).trim().toLowerCase();
          if (term) {
            terms.push(term);
          }
        }
        match = termRegex.exec(this.term_);
      }
    }

    // Remove duplicates
    return [...new Set(terms)];
  }

  /**
   * @param {RegExp} regex
   * @param {!string} text
   * @param {number=} opt_base Defaults to 3
   * @return {number}
   * @protected
   */
  getScore(regex, text, opt_base = 3) {
    var results = regex ? regex.exec(text) : null;
    var terms = this.getTerms();
    if (results && terms.length) {
      if (results.length === 1) {
        // Matched but there weren't any capture groups. Return the base score.
        return opt_base;
      }

      // set up the term map
      var termMap = {};

      for (var i = 0, n = terms.length; i < n; i++) {
        if (terms[i]) {
          termMap[terms[i].toLowerCase()] = 0;
        }
      }

      // Check the text for matches. If the match contains an empty string, this is indicative of a bad regex which can
      // cause an infinite loop. Bail if that happens.
      var score = 0;
      while (results && results.length && !results.some((r) => !r)) {
        for (i = 1, n = results.length; i < n; i++) {
          score += opt_base * results[i].length / text.length;

          // if the result is in the term map, we will mark that term as found
          var result = results[i].toLowerCase();
          if (result in termMap) {
            termMap[result] = 1;
          }
        }
        results = regex.exec(text);
      }

      // get the number of matched terms and the total number of terms
      var termCount = 0;
      var termTotal = 0;
      for (var term in termMap) {
        termCount += termMap[term];
        termTotal++;
      }

      regex.lastIndex = 0;
      return score * termCount / termTotal;
    }

    return 0;
  }
}
