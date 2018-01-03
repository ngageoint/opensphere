goog.provide('plugin.descriptor.DescriptorSearch');

goog.require('goog.Promise');
goog.require('goog.array');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('os.net.JsonEncFormatter');
goog.require('os.net.Request');
goog.require('os.search.AbstractSearch');
goog.require('os.search.IFacetedSearch');
goog.require('os.search.IGeoSearch');
goog.require('os.search.SearchEvent');
goog.require('os.search.SearchEventType');
goog.require('plugin.descriptor.DescriptorResult');
goog.require('plugin.descriptor.facet.Area');
goog.require('plugin.descriptor.facet.SearchTerm');
goog.require('plugin.descriptor.facet.Source');
goog.require('plugin.descriptor.facet.Tag');
goog.require('plugin.descriptor.facet.TagSplit');
goog.require('plugin.descriptor.facet.Type');



/**
 * Searches descriptors
 * @param {string} name
 * @extends {os.search.AbstractSearch}
 * @implements {os.search.IFacetedSearch}
 * @implements {os.search.IGeoSearch}
 * @constructor
 */
plugin.descriptor.DescriptorSearch = function(name) {
  plugin.descriptor.DescriptorSearch.base(this, 'constructor', plugin.descriptor.DescriptorSearch.ID, name);
  this.log = plugin.descriptor.DescriptorSearch.LOGGER_;
  this.priority = 90;
  this.type = plugin.descriptor.DescriptorSearch.ID;

  /**
   * @type {!Array<plugin.descriptor.DescriptorResult>}
   * @private
   */
  this.results_ = [];

  /**
   * @type {os.search.FacetSet}
   * @private
   */
  this.availableFacets_ = {};

  /**
   * @type {?os.search.AppliedFacets}
   * @private
   */
  this.appliedFacets_ = null;

  /**
   * @type {plugin.descriptor.facet.SearchTerm}
   * @private
   */
  this.searchTermFacet_ = new plugin.descriptor.facet.SearchTerm();

  /**
   * @type {!Array<!plugin.descriptor.facet.BaseFacet>}
   * @private
   */
  this.facets_ = [];
  this.initFacets_();
};
goog.inherits(plugin.descriptor.DescriptorSearch, os.search.AbstractSearch);
os.implements(plugin.descriptor.DescriptorSearch, os.search.IFacetedSearch.ID);
os.implements(plugin.descriptor.DescriptorSearch, os.search.IGeoSearch.ID);


/**
 * @private
 */
plugin.descriptor.DescriptorSearch.prototype.initFacets_ = function() {
  this.facets_ = [
    // The current method of bbox testing is not accurate enough, and 3D's method is too slow.
    // To properly enable this, see the corresponding comment in browsedata.js:~52 and ~69
    // new plugin.descriptor.facet.Area(),
    new plugin.descriptor.facet.TagSplit(),
    new plugin.descriptor.facet.Source(),
    new plugin.descriptor.facet.Type(),
    // commenting out because the tag facet is utter nonsense at this point. If you are looking
    // for something specific, just type it in as a keyword search.
    new plugin.descriptor.facet.Tag(),
    this.searchTermFacet_
  ];
};


/**
 * The search identifier.
 * @type {string}
 * @const
 */
plugin.descriptor.DescriptorSearch.ID = 'descriptor';


/**
 * Logger for plugin.descriptor.DescriptorSearch
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.descriptor.DescriptorSearch.LOGGER_ = goog.log.getLogger('plugin.descriptor.DescriptorSearch');


/**
 * @inheritDoc
 */
plugin.descriptor.DescriptorSearch.prototype.cancel = function() {
  // synchronous, so this is empty
};


/**
 * @return {!Array<!os.data.IDataDescriptor>}
 */
plugin.descriptor.DescriptorSearch.prototype.getDescriptors = function() {
  var descriptors = os.dataManager.getDescriptors();

  if (this.geoPayload) {
    descriptors = descriptors.filter(function(d) {
      return os.implements(d, os.ui.ogc.IOGCDescriptor.ID);
    });
  }

  return descriptors;
};


/**
 * @inheritDoc
 */
plugin.descriptor.DescriptorSearch.prototype.autocomplete = function(term, opt_maxResults) {
  this.term = term;
  this.dispatchEvent(new os.search.SearchEvent(os.search.SearchEventType.AUTOCOMPLETED, this.term, []));
};


/**
 * @inheritDoc
 */
plugin.descriptor.DescriptorSearch.prototype.searchTerm = function(term, opt_start, opt_pageSize) {
  this.term = term;
  this.results_.length = 0;
  this.searchTermFacet_.setTerm(term);

  if (this.geoPayload) {
    this.getGeoCounts().then(function(geoCounts) {
      this.doSearch(term, opt_start, opt_pageSize, geoCounts);
    }, undefined, this);
  } else {
    this.doSearch(term, opt_start, opt_pageSize);
  }

  return true;
};


/**
 * @param {string} term
 * @param {number=} opt_start
 * @param {number=} opt_pageSize
 * @param {Object=} opt_geoCounts
 * @protected
 */
plugin.descriptor.DescriptorSearch.prototype.doSearch = function(term, opt_start, opt_pageSize, opt_geoCounts) {
  var descriptors = this.getDescriptors();

  if (opt_geoCounts) {
    descriptors = descriptors.filter(function(d) {
      return /** @type {!os.ui.ogc.IOGCDescriptor} */ (d).getWfsName() in opt_geoCounts;
    });
  }

  var promises = [];
  var results = this.results_;
  var priority = this.getPriority();

  for (var i = 0, n = descriptors.length; i < n; i++) {
    var d = descriptors[i];

    // ensure the provider is enabled
    var provider = d.getDataProvider();
    if (provider && !provider.getEnabled()) {
      continue;
    }

    var maxGeoCount = 0;
    if (opt_geoCounts) {
      for (var key in opt_geoCounts) {
        maxGeoCount = Math.max(opt_geoCounts[key], maxGeoCount);
      }
    }

    // if no term/facets are applied but geo search is enabled, add descriptors without a score
    var isGeoOnly = !term && !!maxGeoCount && !goog.object.getCount(this.appliedFacets_);

    var result = this.testFacets(d);
    var onResult = function(score) {
      if (score || isGeoOnly) {
        // add result
        var count = opt_geoCounts ? opt_geoCounts[d.getWfsName()] : undefined;
        var countScore = count ? (2 * count / maxGeoCount) : 0;
        score = priority + countScore + score / 100;
        results.push(new plugin.descriptor.DescriptorResult(d, score, count));
      }
    };

    if (result instanceof goog.Promise) {
      promises.push(result.then(onResult));
    } else {
      onResult(result);
    }
  }

  goog.array.sort(results, function(a, b) {
    return goog.array.defaultCompare(b.getScore(), a.getScore());
  });

  if (promises.length) {
    goog.Promise.all(promises).then(function(value) {
      this.dispatchEvent(new os.search.SearchEvent(os.search.SearchEventType.SUCCESS,
           this.term, os.search.pageResults(results, opt_start, opt_pageSize), results.length));
    }, undefined, this);
  } else {
    this.dispatchEvent(new os.search.SearchEvent(os.search.SearchEventType.SUCCESS,
         this.term, os.search.pageResults(results, opt_start, opt_pageSize), results.length));
  }
};


/**
 * Get counts for each layer in the current geo query.
 * @return {!goog.Promise}
 * @protected
 */
plugin.descriptor.DescriptorSearch.prototype.getGeoCounts = function() {
  var url = /** @type {string} */ (os.settings.get('hackathon.layerElasticUrl', ''));
  if (url) {
    var request = new os.net.Request();
    request.setUri(url);
    request.setMethod(os.net.Request.METHOD_POST);
    request.setDataFormatter(new os.net.JsonEncFormatter(this.geoPayload));
    request.setHeader('Accept', 'application/json, text/plain, */*');

    return request.getPromise().then(this.handleGeoResult, undefined, this);
  }

  return goog.Promise.resolve();
};


/**
 * Handle result from the layer index.
 * @param {string|undefined} response The server response.
 * @return {!goog.Promise}
 * @protected
 */
plugin.descriptor.DescriptorSearch.prototype.handleGeoResult = function(response) {
  var geoCounts;

  if (response) {
    try {
      var respData = /** @type {Object} */ (JSON.parse(response));
      if (respData) {
        var buckets = goog.object.getValueByKeys(respData, ['aggregations', 'byType', 'buckets']);
        if (buckets) {
          geoCounts = {};

          for (var i = 0; i < buckets.length; i++) {
            var bucket = buckets[i];
            geoCounts[bucket['key']] = bucket['hits']['value'];
          }
        }
      }
    } catch (e) {
      // intentional fall-through
    }
  }

  return goog.Promise.resolve(geoCounts);
};


/**
 * @inheritDoc
 */
plugin.descriptor.DescriptorSearch.prototype.loadFacets = function() {
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
        promises.push(goog.Promise.all(childPromises).then(computeCounts));
      } else {
        computeCounts();
      }
    }
  }

  if (promises.length) {
    var thing = this;
    goog.Promise.all(promises).then(function(value) {
      thing.dispatchEvent(os.search.SearchEventType.FACETLOAD);
    });
  } else {
    this.dispatchEvent(os.search.SearchEventType.FACETLOAD);
  }
};


/**
 * @inheritDoc
 */
plugin.descriptor.DescriptorSearch.prototype.getFacets = function() {
  return this.availableFacets_;
};


/**
 * @inheritDoc
 */
plugin.descriptor.DescriptorSearch.prototype.applyFacets = function(facets) {
  this.appliedFacets_ = facets;
};


/**
 * @inheritDoc
 */
plugin.descriptor.DescriptorSearch.prototype.getLabel = function(category, value) {
  for (var i = 0, n = this.facets_.length; i < n; i++) {
    if (this.facets_[i].transformsValue(category)) {
      return this.facets_[i].valueToLabel(value);
    }
  }

  return value;
};


/**
 * @param {!os.data.IDataDescriptor} descriptor
 * @return {number|goog.Promise} the score or a promise which resolves to the score
 * @protected
 */
plugin.descriptor.DescriptorSearch.prototype.testFacets = function(descriptor) {
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
    return new goog.Promise(function(resolve) {
      goog.Promise.all(promises).then(function() {
        resolve(onResults());
      });
    });
  } else {
    return onResults();
  }
};


/**
 * @inheritDoc
 */
plugin.descriptor.DescriptorSearch.prototype.supportsGeoDistance = function() {
  return false;
};


/**
 * @inheritDoc
 */
plugin.descriptor.DescriptorSearch.prototype.supportsGeoExtent = function() {
  return false;
};


/**
 * @inheritDoc
 */
plugin.descriptor.DescriptorSearch.prototype.supportsGeoShape = function() {
  return true;
};


/**
 * @inheritDoc
 */
plugin.descriptor.DescriptorSearch.prototype.setGeoDistance = function(center, distance) {
  // not supported
};


/**
 * @inheritDoc
 */
plugin.descriptor.DescriptorSearch.prototype.setGeoExtent = function(extent, opt_center) {
  // not supported
};


/**
 * @inheritDoc
 */
plugin.descriptor.DescriptorSearch.prototype.setGeoShape = function(shape) {
  if (shape) {
    this.geoPayload = {
      'query': {
        'bool': {
          'must': {
            'match_all': {}
          },
          'filter': {
            'geo_shape': {
              'bbox': {
                'shape': shape,
                'relation': 'intersects'
              }
            }
          }
        }
      },
      'aggs': {
        'byType': {
          'terms': {
            'field': 'layer.keyword'
          },
          'aggs': {
            'hits': {
              'sum': {
                'field': 'hitCount'
              }
            }
          }
        }
      }
    };
  } else {
    this.geoPayload = undefined;
  }
};
