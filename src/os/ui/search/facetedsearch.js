goog.declareModuleId('os.ui.search.FacetedSearchCtrl');

import {defaultSort} from '../../array/array.js';
import Settings from '../../config/settings.js';
import SearchEventType from '../../search/searcheventtype.js';
import TriState from '../../structs/tristate.js';
import SlickTreeNode from '../slick/slicktreenode.js';
import {apply} from '../ui.js';
import FacetNode from './facetnode.js';

const Delay = goog.require('goog.async.Delay');
const {caseInsensitiveCompare} = goog.require('goog.string');

const {default: AppliedFacets} = goog.requireType('os.search.AppliedFacets');
const {default: IFacetedSearch} = goog.requireType('os.search.IFacetedSearch');
const {default: ISearchResult} = goog.requireType('os.search.ISearchResult');
const {default: SearchEvent} = goog.requireType('os.search.SearchEvent');


/**
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
     * @type {IFacetedSearch}
     * @protected
     */
    this.searchProvider = null;

    $scope.$on('$destroy', this.destroy.bind(this));

    /**
     * @type {Delay}
     * @protected
     */
    this.searchDelay = new Delay(this.onSearch, 50, this);

    /**
     * @type {Delay}
     * @protected
     */
    this.longSearchDelay = new Delay(this.onSearch, 400, this);

    /**
     * @type {boolean}
     * @private
     */
    this.updating_ = false;

    /**
     * @type {!Array<!string>}
     * @private
     */
    this.sortList_ = /** @type {!Array<!string>} */ (Settings.getInstance().get(
        ['facetedSearch', 'categories', 'sort'], []));

    /**
     * @type {!Array<!ISearchResult>}
     * @private
     */
    this.allResults_ = [];

    var provider = Controller.provider;
    this.setProvider(provider);
  }

  /**
   * Clean up on destroy
   *
   * @protected
   */
  destroy() {
    this.setProvider(null);
    this.scope = null;
    this.element = null;
  }

  /**
   * @return {number} page number (0 to n)
   * @protected
   */
  getPage() {
    return 0;
  }

  /**
   * @return {number} page size
   * @protected
   */
  getPageSize() {
    return 30;
  }

  /**
   * @param {?IFacetedSearch} provider
   * @protected
   */
  setProvider(provider) {
    if (this.searchProvider) {
      this.searchProvider.unlisten(SearchEventType.SUCCESS, this.onSuccess, false, this);
      this.searchProvider.unlisten(SearchEventType.ERROR, this.onError, false, this);
      this.searchProvider.unlisten(SearchEventType.AUTOCOMPLETED, this.onAutoComplete, false, this);
      this.searchProvider.unlisten(SearchEventType.FACETLOAD, this.onFacetLoad, false, this);
    }

    this.searchProvider = provider;

    if (this.searchProvider) {
      this.searchProvider.listen(SearchEventType.SUCCESS, this.onSuccess, false, this);
      this.searchProvider.listen(SearchEventType.ERROR, this.onError, false, this);
      this.searchProvider.listen(SearchEventType.AUTOCOMPLETED, this.onAutoComplete, false, this);
      this.searchProvider.listen(SearchEventType.FACETLOAD, this.onFacetLoad, false, this);

      this.onSearch();
    }
  }

  /**
   * @return {?AppliedFacets} The selected facets
   */
  getAppliedFacets() {
    var root = /** @type {SlickTreeNode} */ (this.scope['facetTree']);
    var found = false;
    var facets = /** @type {!AppliedFacets} */ ({});

    if (root) {
      var nodes = root.getChildren();

      if (nodes) {
        for (var i = 0, n = nodes.length; i < n; i++) {
          var enabled = [];
          var children = /** @type {Array<SlickTreeNode>} */ (nodes[i].getChildren());

          if (children) {
            for (var j = 0, m = children.length; j < m; j++) {
              if (children[j].getState() === TriState.ON) {
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
      facets = /** @type {!AppliedFacets} */ (this.scope['facets']);
      found = !!facets;
      this.scope['facets'] = null;
    }

    return found ? facets : null;
  }

  /**
   * Converts the facets to a proper tree for slick grid
   * @suppress {checkTypes} To avoid [] access on a struct.
   */
  onFacetLoad() {
    var applied = this.getAppliedFacets() || {};
    var facets = this.searchProvider.getFacets();

    var root = new SlickTreeNode();

    // convert it to a tree
    var nodes = [];
    for (var category in facets) {
      if (category === 'SearchTerm') {
        continue;
      }

      var values = facets[category];

      if (values) {
        var catNode = new FacetNode();
        catNode.setId(category);
        catNode.setLabel(category);
        catNode.collapsed = false;
        nodes.push(catNode);

        var enabled = applied[category];

        for (var value in values) {
          var valueNode = new FacetNode();
          valueNode.setId(category + ':' + value);
          valueNode.setValue(value);
          valueNode.setLabel(this.searchProvider.getLabel(category, value));
          valueNode.setCount(values[value]);

          if (enabled && enabled.indexOf(value) > -1) {
            valueNode.setState(TriState.ON);
          }

          catNode.addChild(valueNode);
        }

        catNode.getChildren().sort((a, b) => caseInsensitiveCompare(a['label'], b['label']));
      }
    }

    nodes.sort(this.sortCategories.bind(this));
    root.setChildren(nodes);

    var oldRoot = /** @type {SlickTreeNode} */ (this.scope['facetTree']);
    if (oldRoot) {
      oldRoot.unlisten(FacetNode.TYPE, this.search, false, this);

      // copy collapsed state
      var children = /** @type {Array<SlickTreeNode>} */ (oldRoot.getChildren());
      var newChildren = /** @type {Array<SlickTreeNode>} */ (root.getChildren());
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

    root.listen(FacetNode.TYPE, this.search, false, this);

    this.scope['facetTree'] = root;

    if (this.updating_) {
      this.updating_ = false;
      this.search();
    }

    apply(this.scope);
  }

  /**
   * @param {FacetNode} a
   * @param {FacetNode} b
   * @return {number} per compare functions
   * @protected
   */
  sortCategories(a, b) {
    var list = this.sortList_;
    var aLabel = /** @type {!string} */ (a.getLabel());
    var bLabel = /** @type {!string} */ (b.getLabel());
    var ax = list.indexOf(aLabel);
    var bx = list.indexOf(bLabel);

    if (ax === -1 && bx === -1) {
      return caseInsensitiveCompare(aLabel, bLabel);
    } else if (bx === -1) {
      return -1;
    } else if (ax === -1) {
      return 1;
    } else {
      return defaultSort(ax, bx);
    }
  }

  /**
   * Kicks off the search timer
   *
   * @export
   */
  search() {
    this.searchDelay.start();
  }

  /**
   * Use this function for when facets change externally to this controller
   */
  update() {
    this.updating_ = true;
    this.scope['facets'] = this.getAppliedFacets();
    this.scope['facetTree'] = null;
    this.searchProvider.applyFacets(null);
    this.searchProvider.loadFacets();
  }

  /**
   * Kicks off a more delayed search timer
   *
   * @export
   */
  delaySearch() {
    this.longSearchDelay.start();
  }

  /**
   * Clears the search term
   *
   * @export
   */
  clearTerm() {
    this.scope['term'] = '';
    apply(this.scope);
    this.search();
  }

  /**
   * Clears the facets
   */
  clearFacets() {
    this.scope['facets'] = null;
    var root = /** @type {!SlickTreeNode} */ (this.scope['facetTree']);

    this.clearNode(root);
    apply(this.scope);
    this.search();
  }

  /**
   * Clears (turns off) a node
   *
   * @param {!SlickTreeNode} node
   */
  clearNode(node) {
    node.setState(TriState.OFF);

    var children = /** @type {Array<!SlickTreeNode>} */ (node.getChildren());
    if (children) {
      for (var i = 0, n = children.length; i < n; i++) {
        this.clearNode(children[i]);
      }
    }
  }

  /**
   * Clear all
   *
   * @export
   */
  clearAll() {
    this.clearTerm();
    this.clearFacets();
  }

  /**
   * On search timer
   */
  onSearch() {
    this['results'] = [];
    this.searchProvider.applyFacets(this.getAppliedFacets());
    this.searchProvider.search(this.scope['term'] || '');
    apply(this.scope);
  }

  /**
   * @param {SearchEvent} evt
   */
  onSuccess(evt) {
    var list = evt.getResults();
    list.sort(Controller.sortResults_);

    this.allResults_ = list;
    this.showPage();
    this.searchProvider.loadFacets();
    apply(this.scope);
  }

  /**
   * Slices a new page of results from the allResults list
   *
   * @protected
   */
  showPage() {
    var list = this.allResults_;
    var page = this.getPage();
    var pageSize = this.getPageSize();

    var i = Math.min(page * pageSize, list.length);
    var j = Math.min((page + 1) * pageSize, list.length);

    this['results'] = list.slice(i, j);
  }

  /**
   * TODO: Handle error
   */
  onError() {
  }

  /**
   * TODO: Handle auto complete
   */
  onAutoComplete() {
  }

  /**
   * @param {ISearchResult} result
   * @return {number|string}
   * @export
   */
  track(result) {
    return result.getId();
  }

  /**
   * @param {ISearchResult} a
   * @param {ISearchResult} b
   * @return {number}
   * @private
   */
  static sortResults_(a, b) {
    return -1 * defaultSort(a.getScore(), b.getScore());
  }
}

/**
 * @type {?IFacetedSearch}
 */
Controller.provider = null;
