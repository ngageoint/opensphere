goog.provide('os.ui.data.AddDataCtrl');

goog.require('goog.async.Delay');
goog.require('goog.date.UtcDateTime');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('goog.string');
goog.require('os.config');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.metrics.Metrics');
goog.require('os.metrics.keys');
goog.require('os.object');
goog.require('os.structs.ITreeNode');
goog.require('os.ui.bindDirectiveDirective');
goog.require('os.ui.slick.TreeSearch');



/**
 * Controller for Add Data Window
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.data.AddDataCtrl = function($scope, $element) {
  /**
   * @type {string}
   * @private
   */
  this.appName_ = /** @type {string} */ (os.config.getAppName('the application'));

  /**
   * @type {os.structs.ITreeNode}
   * @protected
   */
  this.root = this.initRoot();

  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.searchDelay_ = new goog.async.Delay(this.onSearch_, 250, this);

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * Filter function
   * @type {?function(os.structs.ITreeNode):boolean}
   * @protected
   */
  this.filterFunc = $scope['filter'] || null;

  this['term'] = '';

  this['views'] = this.getGroupBys();

  var viewKey = /** @type {string} */ (os.settings.get(['addData', 'groupBy'], 'Source'));
  this['view'] = this.getGroupBys()[viewKey];

  /**
   * @type {os.ui.slick.TreeSearch}
   * @protected
   */
  this.treeSearch = this.initTreeSearch();
  this.treeSearch.setFilterFunction(this.filterFunc);

  $scope.$on('$destroy', this.onDestroy.bind(this));

  var timeout = /** @type {angular.$timeout} */ (os.ui.injector.get('$timeout'));
  timeout(function() {
    $element.find('.js-input-search').focus();
  });

  this.search();
};


/**
 * Initializes the tree search.
 *
 * @return {!os.ui.slick.TreeSearch}
 * @protected
 */
os.ui.data.AddDataCtrl.prototype.initTreeSearch = function() {
  return new os.ui.slick.TreeSearch([], 'providers', this.scope);
};


/**
 * Initializes the tree root node.
 *
 * @return {!os.structs.ITreeNode}
 * @protected
 */
os.ui.data.AddDataCtrl.prototype.initRoot = function() {
  var root = os.dataManager.getProviderRoot();
  root.listen(goog.events.EventType.PROPERTYCHANGE, this.onChildrenChanged, false, this);

  return root;
};


/**
 * Apply a filter function and re-run search
 *
 * @param {?function(os.structs.ITreeNode):boolean} filterFunc
 */
os.ui.data.AddDataCtrl.prototype.setFilterFunction = function(filterFunc) {
  this.treeSearch.setFilterFunction(filterFunc);
  this.search();
};


/**
 * The view options for choosing layers
 *
 * @return {!Object.<string, ?os.data.groupby.INodeGroupBy>}
 */
os.ui.data.AddDataCtrl.prototype.getGroupBys = function() {
  return {};
};


/**
 * on kaput
 *
 * @protected
 */
os.ui.data.AddDataCtrl.prototype.onDestroy = function() {
  this.searchDelay_.dispose();
  this.searchDelay_ = null;

  this.root.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onChildrenChanged, false, this);
  this.root = null;

  this.treeSearch = null;

  this.scope = null;
  this.element = null;
};


/**
 * Close the window
 *
 * @export
 */
os.ui.data.AddDataCtrl.prototype.close = function() {
  os.ui.window.close(this.element);
};


/**
 * Check if the base tree is empty (no providers are present).
 *
 * @return {boolean}
 * @export
 */
os.ui.data.AddDataCtrl.prototype.isTreeEmpty = function() {
  return this.treeSearch.getSearch().length == 0;
};


/**
 * Handles updates to the tree
 *
 * @param {os.events.PropertyChangeEvent} e
 * @protected
 */
os.ui.data.AddDataCtrl.prototype.onChildrenChanged = function(e) {
  if (e.getProperty() == 'children') {
    this.search();
  } else {
    os.ui.apply(this.scope);
  }
};


/**
 * Starts a search
 *
 * @export
 */
os.ui.data.AddDataCtrl.prototype.search = function() {
  if (this.root && this.treeSearch && this.searchDelay_) {
    var list = this.root.getChildren() || [];
    this.treeSearch.setSearch(/** @type {!Array.<!os.ui.slick.SlickTreeNode>} */ (list.filter(
        os.ui.data.AddDataCtrl.listFilter_)));
    this.searchDelay_.start();

    os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.AddData.SEARCH, 1);
  }
};


/**
 * @param {os.ui.slick.SlickTreeNode} item
 * @param {number} i
 * @param {Array} arr
 * @return {boolean}
 */
os.ui.data.AddDataCtrl.listFilter_ = function(item, i, arr) {
  if (item.getEnabled()) {
    try {
      // show providers that are in a loading state
      if (os.implements(item, os.data.ILoadingProvider.ID)) {
        /** @type {os.data.ILoadingProvider} */ (item).isLoading();
        return true;
      }
    } catch (e) {
      // not a loading provider
    }

    // exclude providers without children so users don't think they can do something with them (unless flagged)
    if (os.ui.data.AddDataCtrl.itemHasChildren_(item)) {
      return true;
    } else {
      return os.ui.data.AddDataCtrl.showWhenEmpty_(item);
    }
  }

  return false;
};

/**
 * Check if the item should be shown even if empty.
 *
 * @param {os.ui.slick.SlickTreeNode} item
 * @return {boolean} if should be shown even when empty
 */
os.ui.data.AddDataCtrl.showWhenEmpty_ = function(item) {
  if (os.implements(item, os.data.IDataProvider.ID)) {
    var dataProviderItem = /** @type {os.data.IDataProvider} */ (item);
    return dataProviderItem.getShowWhenEmpty();
  }
  return false;
};

/**
 * Check if a tree node has child nodes.
 *
 * @param {os.ui.slick.SlickTreeNode} item
 * @return {boolean}
 */
os.ui.data.AddDataCtrl.itemHasChildren_ = function(item) {
  var children = item.getChildren();
  return (!!children && children.length > 0);
};

/**
 * Handles group by selection change
 *
 * @export
 */
os.ui.data.AddDataCtrl.prototype.onGroupByChanged = function() {
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.AddData.GROUP_BY, 1);
  this.search();
};


/**
 * Clears the search
 *
 * @export
 */
os.ui.data.AddDataCtrl.prototype.clearSearch = function() {
  this['term'] = '';
  this.search();
  this.element.find('.search').focus();
};


/**
 * Handles the search timer
 *
 * @private
 */
os.ui.data.AddDataCtrl.prototype.onSearch_ = function() {
  var t = this['term'];

  // save the view option
  var views = this.getGroupBys();

  for (var key in views) {
    if (views[key] === this['view']) {
      os.settings.set(['addData', 'groupBy'], key);
      break;
    }
  }

  // do the search
  this.treeSearch.beginSearch(t, this['view'] == -1 ? null : this['view']);

  os.ui.apply(this.scope);
};


/**
 * Get the content for the info panel
 *
 * @return {string}
 * @export
 */
os.ui.data.AddDataCtrl.prototype.getInfo = function() {
  if (this.isTreeEmpty()) {
    return 'No data available. Click the Import File/URL button above to import data into ' + this.appName_ + '.';
  }

  var node = this.scope['selected'];
  if (goog.isArray(node) && node.length == 1) {
    node = node[0];
  }

  if (node instanceof os.ui.slick.SlickTreeNode) {
    var text = '';
    if (node instanceof os.ui.data.DescriptorNode) {
      // descriptors provide an HTML description
      var d = /** @type {os.ui.data.DescriptorNode} */ (node).getDescriptor();
      if (d) {
        text += d.getHtmlDescription();
      }
    } else if (node instanceof os.ui.data.BaseProvider) {
      // providers can provide directives
      // these strings should be provided entirely by us, and so therefore are NOT sanitized to allow compilation
      return node.getInfo();
    }

    if (!text) {
      // the fallback, just get the tooltip
      text = node.getToolTip();
    }

    if (!text) {
      text = 'No description provided.';
    }

    if (text) {
      os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.AddData.GET_INFO, 1);
      return os.ui.sanitize(goog.string.newLineToBr(text));
    }
  }

  return 'Select an item on the left to see more information.';
};
