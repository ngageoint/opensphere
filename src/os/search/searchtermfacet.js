goog.provide('os.search.SearchTermFacet');

goog.require('os.search.BaseFacet');



/**
 * @constructor
 * @extends {os.search.BaseFacet<T>}
 * @template T
 */
os.search.SearchTermFacet = function() {
  os.search.SearchTermFacet.base(this, 'constructor');

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
};
goog.inherits(os.search.SearchTermFacet, os.search.BaseFacet);


/**
 * @param {string} term
 */
os.search.SearchTermFacet.prototype.setTerm = function(term) {
  this.regex_ = null;
  this.term_ = null;

  if (term) {
    var pattern = os.ui.slick.TreeSearch.getPattern(term).replace(/\.\*/g, '');
    this.regex_ = new RegExp(pattern, 'gi');
    this.term_ = term;
  }
};


/**
 * @inheritDoc
 */
os.search.SearchTermFacet.prototype.load = function(item, facets) {
  // Don't show the search term facet
};


/**
 * @inheritDoc
 */
os.search.SearchTermFacet.prototype.test = function(item, facets, results) {
  if (this.regex_) {
    os.search.BaseFacet.updateResults('SearchTerm', results);

    var score = this.testInternal(item);
    if (score) {
      os.search.BaseFacet.updateResults('SearchTerm', results, score);
    }
  }
};


/**
 * Test a search item.
 * @param {T} item The search item.
 * @return {number} score The search score.
 * @template T
 */
os.search.SearchTermFacet.prototype.testInternal = function(item) {
  var texts = this.getTexts(item);
  var score = 0;
  for (var t = 0, m = texts.length; t < m; t++) {
    if (texts[t]) {
      score += this.getScore(this.regex_, texts[t], 10 * (t + 1));
    }
  }

  return score;
};


/**
 * Get the texts to search from the item.
 * @param {T} item The search item.
 * @return {!Array<string>} The texts to search.
 * @template T
 */
os.search.SearchTermFacet.prototype.getTexts = function(item) {
  return [];
};


/**
 * Get the terms from the search string.
 * @return {!Array<string>} The terms.
 * @protected
 */
os.search.SearchTermFacet.prototype.getTerms = function() {
  const terms = [];
  if (this.term_) {
    const termRegex = /[^\s"]+|"([^"]*)"/gi;
    let match = termRegex.exec(this.term_);
    while (match) {
      if (match) {
        // Index 1 in the array is the captured group if it exists
        // Index 0 is the matched text, which we use if no captured group exists
        terms.push((match[1] ? match[1] : match[0]).toLowerCase());
      }
      match = termRegex.exec(this.term_);
    }
  }

  // Remove duplicates
  return [...new Set(terms)];
};


/**
 * @param {RegExp} regex
 * @param {!string} text
 * @param {number=} opt_base Defaults to 3
 * @return {number}
 * @protected
 */
os.search.SearchTermFacet.prototype.getScore = function(regex, text, opt_base = 3) {
  var results = regex.exec(text);
  if (results && results.length === 1) {
    // Matched but there weren't any capture groups. Return the base score.
    return opt_base;
  }

  // set up the term map
  var terms = this.getTerms();
  var termMap = {};

  for (var i = 0, n = terms.length; i < n; i++) {
    if (terms[i]) {
      termMap[terms[i].toLowerCase()] = 0;
    }
  }

  // check the text for matches
  var score = 0;
  while (results && results.length) {
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
};


