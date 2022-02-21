goog.declareModuleId('plugin.descriptor.DescriptorSearch');

import DataManager from '../../os/data/datamanager.js';
import osImplements from '../../os/implements.js';
import AbstractSearch from '../../os/search/abstractsearch.js';
import IFacetedSearch from '../../os/search/ifacetedsearch.js';
import * as search from '../../os/search/search.js';
import SearchEvent from '../../os/search/searchevent.js';
import SearchEventType from '../../os/search/searcheventtype.js';
import DescriptorResult from './descriptorresult.js';
import SearchTerm from './facet/searchtermfacet.js';
import Source from './facet/sourcefacet.js';
import Tag from './facet/tagfacet.js';
import TagSplit from './facet/tagsplitfacet.js';
import Type from './facet/typefacet.js';

const Promise = goog.require('goog.Promise');
const googArray = goog.require('goog.array');
const log = goog.require('goog.log');


/**
 * Searches descriptors
 *
 * @implements {IFacetedSearch}
 */
export default class DescriptorSearch extends AbstractSearch {
  /**
   * Constructor.
   * @param {string} name
   */
  constructor(name) {
    super(DescriptorSearch.ID, name);
    this.log = logger;
    this.priority = 90;
    this.type = DescriptorSearch.ID;

    /**
     * @type {Array<DescriptorResult>}
     * @private
     */
    this.results_ = [];

    /**
     * @type {FacetSet}
     * @private
     */
    this.availableFacets_ = {};

    /**
     * @type {?AppliedFacets}
     * @private
     */
    this.appliedFacets_ = null;

    /**
     * @type {SearchTerm}
     * @private
     */
    this.searchTermFacet_ = new SearchTerm();

    /**
     * @type {!Array<!BaseFacet<!IDataDescriptor>>}
     * @private
     */
    this.facets_ = [];
    this.initFacets_();
  }

  /**
   * @private
   */
  initFacets_() {
    this.facets_ = [
      new TagSplit(),
      new Source(),
      new Type(),
      // commenting out because the tag facet is utter nonsense at this point. If you are looking
      // for something specific, just type it in as a keyword search.
      new Tag(),
      this.searchTermFacet_
    ];
  }

  /**
   * @inheritDoc
   */
  cancel() {
    // synchronous, so this is empty
  }

  /**
   * @return {!Array<!IDataDescriptor>}
   */
  getDescriptors() {
    return DataManager.getInstance().getDescriptors();
  }

  /**
   * @inheritDoc
   */
  autocomplete(term, opt_maxResults) {
    this.term = term;
    this.dispatchEvent(new SearchEvent(SearchEventType.AUTOCOMPLETED, this.term, []));
  }

  /**
   * @inheritDoc
   */
  searchTerm(term, opt_start, opt_pageSize) {
    this.term = term;
    this.results_.length = 0;
    this.searchTermFacet_.setTerm(term);

    var descriptors = this.getDescriptors();
    var promises = [];
    var results = this.results_;
    var priority = this.getPriority();

    if (descriptors) {
      for (var i = 0, n = descriptors.length; i < n; i++) {
        var d = descriptors[i];

        // ensure the provider is enabled
        var provider = d.getDataProvider();
        if (provider && !provider.getEnabled()) {
          continue;
        }

        var result = this.testFacets(d);
        var onResult = function(score) {
          if (score) {
            // add result
            score = priority + score / 100;
            results.push(new DescriptorResult(d, score));
          }
        };

        if (result instanceof Promise) {
          promises.push(result.then(onResult));
        } else {
          onResult(result);
        }
      }
    }

    googArray.sort(results, function(a, b) {
      return googArray.defaultCompare(b.getScore(), a.getScore());
    });

    if (promises.length) {
      var self = this;
      Promise.all(promises).then(function(value) {
        self.dispatchEvent(new SearchEvent(SearchEventType.SUCCESS,
            self.term, search.pageResults(results, opt_start, opt_pageSize), results.length));
      });
    } else {
      this.dispatchEvent(new SearchEvent(SearchEventType.SUCCESS,
          this.term, search.pageResults(results, opt_start, opt_pageSize), results.length));
    }

    return true;
  }

  /**
   * @inheritDoc
   */
  loadFacets() {
    var applied = this.appliedFacets_ || {};
    var available = this.availableFacets_ = {};
    var descriptors = this.getDescriptors();
    var promises = [];

    if (descriptors) {
      var facets = this.facets_;

      for (var i = 0, n = descriptors.length; i < n; i++) {
        var d = descriptors[i];
        var counts = {};
        var tests = {};

        var childPromises = [];

        for (var j = 0, m = facets.length; j < m; j++) {
          var promise = facets[j].load(d, counts);
          if (promise) {
            childPromises.push(promise);
          }

          promise = facets[j].test(d, applied, tests);
          if (promise) {
            childPromises.push(promise);
          }
        }

        var computeCounts = function() {
          for (var cat in counts) {
            var matches = true;
            for (var cat2 in tests) {
              if (cat !== cat2 && !tests[cat2]) {
                matches = false;
              }
            }

            for (var value in counts[cat]) {
              if (!available[cat]) {
                available[cat] = {};
              }

              if (!available[cat][value]) {
                available[cat][value] = 0;
              }

              available[cat][value] += matches ? 1 : 0;
            }
          }
        };

        if (childPromises.length) {
          promises.push(Promise.all(childPromises).then(computeCounts));
        } else {
          computeCounts();
        }
      }
    }

    if (promises.length) {
      var thing = this;
      Promise.all(promises).then(function(value) {
        thing.dispatchEvent(SearchEventType.FACETLOAD);
      });
    } else {
      this.dispatchEvent(SearchEventType.FACETLOAD);
    }
  }

  /**
   * @inheritDoc
   */
  getFacets() {
    return this.availableFacets_;
  }

  /**
   * @inheritDoc
   */
  applyFacets(facets) {
    this.appliedFacets_ = facets;
  }

  /**
   * @inheritDoc
   */
  getLabel(category, value) {
    for (var i = 0, n = this.facets_.length; i < n; i++) {
      if (this.facets_[i].transformsValue(category)) {
        return this.facets_[i].valueToLabel(value);
      }
    }

    return value;
  }

  /**
   * @param {!IDataDescriptor} descriptor
   * @return {number|Promise} the score or a promise which resolves to the score
   * @protected
   */
  testFacets(descriptor) {
    var applied = this.appliedFacets_ || {};
    var results = {};
    var facets = this.facets_;

    var promises = [];

    for (var i = 0, n = facets.length; i < n; i++) {
      var promise = facets[i].test(descriptor, applied, results);
      if (promise) {
        promises.push(promise);
      }
    }

    var onResults = function() {
      // if any of the result categories has a 0, then that facet wasn't matched
      var score = 0;
      for (var cat in results) {
        var val = results[cat];

        if (!val) {
          return 0;
        }

        score += val;
      }

      return score;
    };

    if (promises.length) {
      return new Promise(function(resolve) {
        Promise.all(promises).then(function() {
          resolve(onResults());
        });
      });
    } else {
      return onResults();
    }
  }
}

osImplements(DescriptorSearch, IFacetedSearch.ID);


/**
 * The search identifier.
 * @type {string}
 * @const
 */
DescriptorSearch.ID = 'descriptor';


/**
 * Logger for plugin.descriptor.DescriptorSearch
 * @type {log.Logger}
 */
const logger = log.getLogger('plugin.descriptor.DescriptorSearch');
