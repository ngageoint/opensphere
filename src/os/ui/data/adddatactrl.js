goog.declareModuleId('os.ui.data.AddDataCtrl');

import '../binddirective.js';
import SlickTreeNode from '../slick/slicktreenode.js';
import TreeSearch from '../slick/treesearch.js';
import * as ui from '../ui.js';
import * as osWindow from '../window.js';
import BaseProvider from './baseprovider.js';
import DescriptorNode from './descriptornode.js';

const Delay = goog.require('goog.async.Delay');
const GoogEventType = goog.require('goog.events.EventType');
const googString = goog.require('goog.string');
const config = goog.require('os.config');
const Settings = goog.require('os.config.Settings');
const DataManager = goog.require('os.data.DataManager');
const IDataProvider = goog.require('os.data.IDataProvider');
const ILoadingProvider = goog.require('os.data.ILoadingProvider');
const osImplements = goog.require('os.implements');
const Metrics = goog.require('os.metrics.Metrics');
const keys = goog.require('os.metrics.keys');

const INodeGroupBy = goog.requireType('os.data.groupby.INodeGroupBy');
const PropertyChangeEvent = goog.requireType('os.events.PropertyChangeEvent');
const ITreeNode = goog.requireType('os.structs.ITreeNode');


/**
 * Controller for Add Data Window
 * @unrestricted
 */
export default class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {string}
     * @private
     */
    this.appName_ = /** @type {string} */ (config.getAppName('the application'));

    /**
     * @type {ITreeNode}
     * @protected
     */
    this.root = this.initRoot();

    /**
     * @type {Delay}
     * @private
     */
    this.searchDelay_ = new Delay(this.onSearch_, 250, this);

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
     * @type {?function(ITreeNode):boolean}
     * @protected
     */
    this.filterFunc = $scope['filter'] || null;

    this['term'] = '';

    this['views'] = this.getGroupBys();

    var viewKey = /** @type {string} */ (Settings.getInstance().get(['addData', 'groupBy'], 'Source'));
    this['view'] = this.getGroupBys()[viewKey];

    /**
     * @type {TreeSearch}
     * @protected
     */
    this.treeSearch = this.initTreeSearch();
    this.treeSearch.setFilterFunction(this.filterFunc);

    $scope.$on('$destroy', this.onDestroy.bind(this));

    var timeout = /** @type {angular.$timeout} */ (ui.injector.get('$timeout'));
    timeout(function() {
      $element.find('.js-input-search').focus();
    });

    this.search();
  }

  /**
   * Initializes the tree search.
   *
   * @return {!TreeSearch}
   * @protected
   */
  initTreeSearch() {
    return new TreeSearch([], 'providers', this.scope);
  }

  /**
   * Initializes the tree root node.
   *
   * @return {!ITreeNode}
   * @protected
   */
  initRoot() {
    var root = DataManager.getInstance().getProviderRoot();
    root.listen(GoogEventType.PROPERTYCHANGE, this.onChildrenChanged, false, this);

    return root;
  }

  /**
   * Apply a filter function and re-run search
   *
   * @param {?function(ITreeNode):boolean} filterFunc
   */
  setFilterFunction(filterFunc) {
    this.treeSearch.setFilterFunction(filterFunc);
    this.search();
  }

  /**
   * The view options for choosing layers
   *
   * @return {!Object<string, ?INodeGroupBy>}
   */
  getGroupBys() {
    return {};
  }

  /**
   * on kaput
   *
   * @protected
   */
  onDestroy() {
    this.searchDelay_.dispose();
    this.searchDelay_ = null;

    this.root.unlisten(GoogEventType.PROPERTYCHANGE, this.onChildrenChanged, false, this);
    this.root = null;

    this.treeSearch = null;

    this.scope = null;
    this.element = null;
  }

  /**
   * Close the window
   *
   * @export
   */
  close() {
    osWindow.close(this.element);
  }

  /**
   * Check if the base tree is empty (no providers are present).
   *
   * @return {boolean}
   * @export
   */
  isTreeEmpty() {
    return this.treeSearch.getSearch().length == 0;
  }

  /**
   * Handles updates to the tree
   *
   * @param {PropertyChangeEvent} e
   * @protected
   */
  onChildrenChanged(e) {
    if (e.getProperty() == 'children') {
      this.search();
    } else {
      ui.apply(this.scope);
    }
  }

  /**
   * Starts a search
   *
   * @export
   */
  search() {
    if (this.root && this.treeSearch && this.searchDelay_) {
      var list = this.root.getChildren() || [];
      this.treeSearch.setSearch(/** @type {!Array<!SlickTreeNode>} */ (list.filter(
          Controller.listFilter_)));
      this.searchDelay_.start();

      Metrics.getInstance().updateMetric(keys.AddData.SEARCH, 1);
    }
  }

  /**
   * Handles group by selection change
   *
   * @export
   */
  onGroupByChanged() {
    Metrics.getInstance().updateMetric(keys.AddData.GROUP_BY, 1);
    this.search();
  }

  /**
   * Clears the search
   *
   * @export
   */
  clearSearch() {
    this['term'] = '';
    this.search();
    this.element.find('.search').focus();
  }

  /**
   * Handles the search timer
   *
   * @private
   */
  onSearch_() {
    var t = this['term'];

    // save the view option
    var views = this.getGroupBys();

    for (var key in views) {
      if (views[key] === this['view']) {
        Settings.getInstance().set(['addData', 'groupBy'], key);
        break;
      }
    }

    // do the search
    this.treeSearch.beginSearch(t, this['view'] == -1 ? null : this['view']);

    ui.apply(this.scope);
  }

  /**
   * Get the content for the info panel
   *
   * @return {string}
   * @export
   */
  getInfo() {
    if (this.isTreeEmpty()) {
      return 'No data available. Click the Import File/URL button above to import data into ' + this.appName_ + '.';
    }

    var node = this.scope['selected'];
    if (Array.isArray(node) && node.length == 1) {
      node = node[0];
    }

    if (node instanceof SlickTreeNode) {
      var text = '';
      if (node instanceof DescriptorNode) {
        // descriptors provide an HTML description
        var d = /** @type {DescriptorNode} */ (node).getDescriptor();
        if (d) {
          text += d.getHtmlDescription();
        }
      } else if (node instanceof BaseProvider) {
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
        Metrics.getInstance().updateMetric(keys.AddData.GET_INFO, 1);
        return ui.sanitize(googString.newLineToBr(text));
      }
    }

    return 'Select an item on the left to see more information.';
  }

  /**
   * @param {SlickTreeNode} item
   * @param {number} i
   * @param {Array} arr
   * @return {boolean}
   */
  static listFilter_(item, i, arr) {
    if (item.getEnabled()) {
      try {
        // show providers that are in a loading state
        if (osImplements(item, ILoadingProvider.ID)) {
          /** @type {ILoadingProvider} */ (item).isLoading();
          return true;
        }
      } catch (e) {
        // not a loading provider
      }

      // exclude providers without children so users don't think they can do something with them (unless flagged)
      if (Controller.itemHasChildren_(item)) {
        return true;
      } else {
        return Controller.showWhenEmpty_(item);
      }
    }

    return false;
  }

  /**
   * Check if the item should be shown even if empty.
   *
   * @param {SlickTreeNode} item
   * @return {boolean} if should be shown even when empty
   */
  static showWhenEmpty_(item) {
    if (osImplements(item, IDataProvider.ID)) {
      var dataProviderItem = /** @type {IDataProvider} */ (item);
      return dataProviderItem.getShowWhenEmpty();
    }
    return false;
  }

  /**
   * Check if a tree node has child nodes.
   *
   * @param {SlickTreeNode} item
   * @return {boolean}
   */
  static itemHasChildren_(item) {
    var children = item.getChildren();
    return (!!children && children.length > 0);
  }
}
