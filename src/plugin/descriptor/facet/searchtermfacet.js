goog.provide('plugin.descriptor.facet.SearchTerm');

goog.require('plugin.descriptor.facet.BaseFacet');



/**
 * @constructor
 * @extends {plugin.descriptor.facet.BaseFacet}
 */
plugin.descriptor.facet.SearchTerm = function() {
  plugin.descriptor.facet.SearchTerm.base(this, 'constructor');

  /**
   * @type {?RegExp}
   * @private
   */
  this.regex_ = null;

  /**
   * @type {number}
   * @private
   */
  this.dateThreshold_ = -1;
};
goog.inherits(plugin.descriptor.facet.SearchTerm, plugin.descriptor.facet.BaseFacet);


/**
 * @type {number}
 * @private
 */
plugin.descriptor.facet.SearchTerm.DURATION_ = 2 * 7 * 24 * 60 * 60 * 1000;


/**
 * @param {string} term
 */
plugin.descriptor.facet.SearchTerm.prototype.setTerm = function(term) {
  this.regex_ = null;
  this.dateThreshold_ = -1;

  if (term) {
    var pattern = os.ui.slick.TreeSearch.getPattern(term).replace(/\.\*/g, '');
    this.regex_ = new RegExp(pattern, 'gi');

    var now = goog.now();
    this.dateThreshold_ = now - plugin.descriptor.facet.SearchTerm.DURATION_;
  }
};


/**
 * @inheritDoc
 */
plugin.descriptor.facet.SearchTerm.prototype.load = function(descriptor, facets) {
  // Dont show the searchterm facet
};


/**
 * @inheritDoc
 */
plugin.descriptor.facet.SearchTerm.prototype.test = function(descriptor, facets, results) {
  if (this.regex_) {
    plugin.descriptor.facet.BaseFacet.updateResults('SearchTerm', results);
    var score = this.testInternal(descriptor);

    if (score) {
      plugin.descriptor.facet.BaseFacet.updateResults('SearchTerm', results, score);
    }
  }
};


/**
 * @param {os.data.IDataDescriptor} descriptor
 * @return {number} score
 */
plugin.descriptor.facet.SearchTerm.prototype.testInternal = function(descriptor) {
  var texts = [descriptor.getSearchText(), descriptor.getTitle()];

  var score = 0;
  for (var t = 0, m = texts.length; t < m; t++) {
    if (texts[t]) {
      score += this.getScore(this.regex_, texts[t], 10 * (t + 1));
    }
  }

  if (score) {
    // items that the user has recently activated should be higher in the list
    var lastActive = descriptor.getLastActive();
    var duration = plugin.descriptor.facet.SearchTerm.DURATION_;

    if (!isNaN(lastActive)) {
      score += 5 * (Math.max(0, lastActive - this.dateThreshold_) / duration);
    }
  }

  return score;
};


/**
 * @param {RegExp} regex
 * @param {!string} text
 * @param {number=} opt_base Defaults to 3
 * @return {number}
 * @protected
 */
plugin.descriptor.facet.SearchTerm.prototype.getScore = function(regex, text, opt_base) {
  opt_base = opt_base || 3;
  var score = 0;
  var results = regex.exec(text);

  // set up the term map
  var terms = regex.source.split(/[(|)]/);
  var termMap = {};

  for (var i = 0, n = terms.length; i < n; i++) {
    if (terms[i]) {
      termMap[terms[i]] = 0;
    }
  }

  // check the text for matches
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


