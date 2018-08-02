goog.provide('os.ui.search.FacetedSearchCtrl');

goog.require('goog.array');
goog.require('goog.async.Delay');
goog.require('goog.string');
goog.require('os.ui.search.FacetNode');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.search.FacetedSearchCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * @type {os.search.IFacetedSearch}
   * @protected
   */
  this.searchProvider = null;

  $scope.$on('$destroy', this.destroy.bind(this));

  /**
   * @type {goog.async.Delay}
   * @protected
   */
  this.searchDelay = new goog.async.Delay(this.onSearch, 50, this);

  /**
   * @type {goog.async.Delay}
   * @protected
   */
  this.longSearchDelay = new goog.async.Delay(this.onSearch, 400, this);

  /**
   * @type {boolean}
   * @private
   */
  this.updating_ = false;

  /**
   * @type {!Array<!string>}
   * @private
   */
  this.sortList_ = /** @type {!Array<!string>} */ (os.settings.get(
      ['facetedSearch', 'categories', 'sort'], []));

  /**
   * @type {!Array<!os.search.ISearchResult>}
   * @private
   */
  this.allResults_ = [];

  var provider = os.ui.search.FacetedSearchCtrl.provider;
  this.setProvider(provider);
};


/**
 * @type {?os.search.IFacetedSearch}
 */
os.ui.search.FacetedSearchCtrl.provider = null;


/**
 * Clean up on destroy
 * @protected
 */
os.ui.search.FacetedSearchCtrl.prototype.destroy = function() {
  this.setProvider(null);
  this.scope = null;
  this.element = null;
};


/**
 * @return {number} page number (0 to n)
 * @protected
 */
os.ui.search.FacetedSearchCtrl.prototype.getPage = function() {
  return 0;
};


/**
 * @return {number} page size
 * @protected
 */
os.ui.search.FacetedSearchCtrl.prototype.getPageSize = function() {
  return 30;
};


/**
 * @param {?os.search.IFacetedSearch} provider
 * @protected
 */
os.ui.search.FacetedSearchCtrl.prototype.setProvider = function(provider) {
  if (this.searchProvider) {
    this.searchProvider.unlisten(os.search.SearchEventType.SUCCESS, this.onSuccess, false, this);
    this.searchProvider.unlisten(os.search.SearchEventType.ERROR, this.onError, false, this);
    this.searchProvider.unlisten(os.search.SearchEventType.AUTOCOMPLETED, this.onAutoComplete, false, this);
    this.searchProvider.unlisten(os.search.SearchEventType.FACETLOAD, this.onFacetLoad, false, this);
  }

  this.searchProvider = provider;

  if (this.searchProvider) {
    this.searchProvider.listen(os.search.SearchEventType.SUCCESS, this.onSuccess, false, this);
    this.searchProvider.listen(os.search.SearchEventType.ERROR, this.onError, false, this);
    this.searchProvider.listen(os.search.SearchEventType.AUTOCOMPLETED, this.onAutoComplete, false, this);
    this.searchProvider.listen(os.search.SearchEventType.FACETLOAD, this.onFacetLoad, false, this);

    this.onSearch();
  }
};


/**
 * @return {?os.search.AppliedFacets} The selected facets
 */
os.ui.search.FacetedSearchCtrl.prototype.getAppliedFacets = function() {
  var root = /** @type {os.ui.slick.SlickTreeNode} */ (this.scope['facetTree']);
  var found = false;
  var facets = /** @type {!os.search.AppliedFacets} */ ({});

  if (root) {
    var nodes = root.getChildren();

    if (nodes) {
      for (var i = 0, n = nodes.length; i < n; i++) {
        var enabled = [];
        var children = nodes[i].getChildren();

        if (children) {
          for (var j = 0, m = children.length; j < m; j++) {
            if (children[j].getState() === os.structs.TriState.ON) {
              enabled.push(children[j].getValue());
            }
          }
        }

        if (enabled.length) {
          facets[nodes[i].getId()] = enabled;
          found = true;
        }
      }
    }
  } else {
    facets = /** @type {!os.search.AppliedFacets} */ (this.scope['facets']);
    found = !!facets;
    this.scope['facets'] = null;
  }

  return found ? facets : null;
};


/**
 * Converts the facets to a proper tree for slick grid
 */
os.ui.search.FacetedSearchCtrl.prototype.onFacetLoad = function() {
  var applied = this.getAppliedFacets() || {};
  var facets = this.searchProvider.getFacets();

  var root = new os.ui.slick.SlickTreeNode();

  // convert it to a tree
  var nodes = [];
  for (var category in facets) {
    if (category === 'SearchTerm') {
      continue;
    }

    var values = facets[category];

    if (values) {
      var catNode = new os.ui.search.FacetNode();
      catNode.setId(category);
      catNode.setLabel(category);
      catNode.collapsed = false;
      nodes.push(catNode);

      var enabled = applied[category];

      for (var value in values) {
        var valueNode = new os.ui.search.FacetNode();
        valueNode.setId(category + ':' + value);
        valueNode.setValue(value);
        valueNode.setLabel(this.searchProvider.getLabel(category, value));
        valueNode.setCount(values[value]);

        if (enabled && enabled.indexOf(value) > -1) {
          valueNode.setState(os.structs.TriState.ON);
        }

        catNode.addChild(valueNode);
      }

      goog.array.sortObjectsByKey(catNode.getChildren(), 'label', goog.string.caseInsensitiveCompare);
    }
  }

  nodes.sort(this.sortCategories.bind(this));
  root.setChildren(nodes);

  var oldRoot = /** @type {os.ui.slick.SlickTreeNode} */ (this.scope['facetTree']);
  if (oldRoot) {
    oldRoot.unlisten(os.ui.search.FacetNode.TYPE, this.search, false, this);

    // copy collapsed state
    var children = oldRoot.getChildren();
    var newChildren = root.getChildren();
    if (children && newChildren) {
      for (var i = 0, n = children.length; i < n; i++) {
        if (children[i].collapsed) {
          for (var j = 0, m = newChildren.length; j < m; j++) {
            if (newChildren[j].getId() === children[i].getId()) {
              newChildren[j].collapsed = true;
              break;
            }
          }
        }
      }
    }
  }

  root.listen(os.ui.search.FacetNode.TYPE, this.search, false, this);

  this.scope['facetTree'] = root;

  if (this.updating_) {
    this.updating_ = false;
    this.search();
  }

  os.ui.apply(this.scope);
};


/**
 * @param {os.ui.search.FacetNode} a
 * @param {os.ui.search.FacetNode} b
 * @return {number} per compare functions
 * @protected
 */
os.ui.search.FacetedSearchCtrl.prototype.sortCategories = function(a, b) {
  var list = this.sortList_;
  var aLabel = /** @type {!string} */ (a.getLabel());
  var bLabel = /** @type {!string} */ (b.getLabel());
  var ax = list.indexOf(aLabel);
  var bx = list.indexOf(bLabel);

  if (ax === -1 && bx === -1) {
    return goog.string.caseInsensitiveCompare(aLabel, bLabel);
  } else if (bx === -1) {
    return -1;
  } else if (ax === -1) {
    return 1;
  } else {
    return goog.array.defaultCompare(ax, bx);
  }
};


/**
 * Kicks off the search timer
 */
os.ui.search.FacetedSearchCtrl.prototype.search = function() {
  this.searchDelay.start();
};
goog.exportProperty(os.ui.search.FacetedSearchCtrl.prototype, 'search',
    os.ui.search.FacetedSearchCtrl.prototype.search);


/**
 * Use this function for when facets change externally to this controller
 */
os.ui.search.FacetedSearchCtrl.prototype.update = function() {
  this.updating_ = true;
  this.scope['facets'] = this.getAppliedFacets();
  this.scope['facetTree'] = null;
  this.searchProvider.applyFacets(null);
  this.searchProvider.loadFacets();
};


/**
 * Kicks off a more delayed search timer
 */
os.ui.search.FacetedSearchCtrl.prototype.delaySearch = function() {
  this.longSearchDelay.start();
};
goog.exportProperty(os.ui.search.FacetedSearchCtrl.prototype, 'delaySearch',
    os.ui.search.FacetedSearchCtrl.prototype.delaySearch);


/**
 * Clears the search term
 */
os.ui.search.FacetedSearchCtrl.prototype.clearTerm = function() {
  this.scope['term'] = '';
  os.ui.apply(this.scope);
  this.search();
};
goog.exportProperty(os.ui.search.FacetedSearchCtrl.prototype, 'clearTerm',
    os.ui.search.FacetedSearchCtrl.prototype.clearTerm);


/**
 * Clears the facets
 */
os.ui.search.FacetedSearchCtrl.prototype.clearFacets = function() {
  this.scope['facets'] = null;
  var root = /** @type {!os.ui.slick.SlickTreeNode} */ (this.scope['facetTree']);

  this.clearNode(root);
  os.ui.apply(this.scope);
  this.search();
};


/**
 * Clears (turns off) a node
 * @param {!os.ui.slick.SlickTreeNode} node
 */
os.ui.search.FacetedSearchCtrl.prototype.clearNode = function(node) {
  node.setState(os.structs.TriState.OFF);

  var children = /** @type {Array<!os.ui.slick.SlickTreeNode>} */ (node.getChildren());
  if (children) {
    for (var i = 0, n = children.length; i < n; i++) {
      this.clearNode(children[i]);
    }
  }
};


/**
 * Clear all
 */
os.ui.search.FacetedSearchCtrl.prototype.clearAll = function() {
  this.clearTerm();
  this.clearFacets();
};
goog.exportProperty(os.ui.search.FacetedSearchCtrl.prototype, 'clearAll',
    os.ui.search.FacetedSearchCtrl.prototype.clearAll);


/**
 * On search timer
 */
os.ui.search.FacetedSearchCtrl.prototype.onSearch = function() {
  this['results'] = [];
  this.searchProvider.applyFacets(this.getAppliedFacets());
  this.searchProvider.search(this.scope['term'] || '');
  os.ui.apply(this.scope);
};


/**
 * @param {os.search.SearchEvent} evt
 */
os.ui.search.FacetedSearchCtrl.prototype.onSuccess = function(evt) {
  var list = evt.getResults();
  list.sort(os.ui.search.FacetedSearchCtrl.sortResults_);

  this.allResults_ = list;
  this.showPage();
  this.searchProvider.loadFacets();
  os.ui.apply(this.scope);
};


/**
 * Slices a new page of results from the allResults list
 * @protected
 */
os.ui.search.FacetedSearchCtrl.prototype.showPage = function() {
  var list = this.allResults_;
  var page = this.getPage();
  var pageSize = this.getPageSize();

  var i = Math.min(page * pageSize, list.length);
  var j = Math.min((page + 1) * pageSize, list.length);

  this['results'] = list.slice(i, j);
};


/**
 * @param {os.search.ISearchResult} a
 * @param {os.search.ISearchResult} b
 * @return {number}
 * @private
 */
os.ui.search.FacetedSearchCtrl.sortResults_ = function(a, b) {
  return -1 * goog.array.defaultCompare(a.getScore(), b.getScore());
};


/**
 * TODO: Handle error
 */
os.ui.search.FacetedSearchCtrl.prototype.onError = function() {
};


/**
 * TODO: Handle auto complete
 */
os.ui.search.FacetedSearchCtrl.prototype.onAutoComplete = function() {
};


/**
 * @param {os.search.ISearchResult} result
 * @return {number|string}
 */
os.ui.search.FacetedSearchCtrl.prototype.track = function(result) {
  return result.getId();
};
goog.exportProperty(os.ui.search.FacetedSearchCtrl.prototype, 'track',
    os.ui.search.FacetedSearchCtrl.prototype.track);
