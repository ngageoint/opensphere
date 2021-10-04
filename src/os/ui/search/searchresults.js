goog.declareModuleId('os.ui.search.SearchResultsUI');

import '../util/autoheight.js';
import './resultcard.js';
import {ROOT} from '../../os.js';
import SearchEventType from '../../search/searcheventtype.js';
import SearchManager from '../../search/searchmanager.js';
import Module from '../module.js';
import {apply} from '../ui.js';

const {default: ISearchResult} = goog.requireType('os.search.ISearchResult');


const {default: SearchEvent} = goog.requireType('os.search.SearchEvent');


/**
 * The searchresults directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  scope: {
    'parent': '@'
  },
  replace: true,
  transclude: true,
  templateUrl: ROOT + 'views/search/searchresults.html',
  controller: Controller,
  controllerAs: 'searchResults'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'searchresults';

/**
 * Register the searchresults directive.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the searchresults directive.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {boolean}
     */
    this['show'] = false;

    /**
     * @type {Array<ISearchResult>}
     */
    this['results'] = [];

    /**
     * @type {boolean}
     */
    this['loading'] = false;

    var sm = SearchManager.getInstance();
    sm.listen(SearchEventType.START, this.handleSearchStart_, false, this);
    sm.listen(SearchEventType.SUCCESS, this.handleSearchSuccess_, false, this);
    sm.listen(SearchEventType.PROGRESS, this.handleSearchSuccess_, false, this);
    sm.listen(SearchEventType.AUTOCOMPLETED, this.handleAutocomplete_, false, this);

    $scope.$on('$destroy', this.destroy_.bind(this));
    this.updateResults();
  }

  /**
   * @private
   */
  destroy_() {
    var sm = SearchManager.getInstance();
    sm.unlisten(SearchEventType.START, this.handleSearchStart_, false, this);
    sm.unlisten(SearchEventType.SUCCESS, this.handleSearchSuccess_, false, this);
    sm.unlisten(SearchEventType.PROGRESS, this.handleSearchSuccess_, false, this);
    sm.unlisten(SearchEventType.AUTOCOMPLETED, this.handleAutocomplete_, false, this);

    this.scope_ = null;
  }

  /**
   * Clears the search results.
   *
   * @private
   */
  clear_() {
    this['results'].length = 0;
    this['show'] = false;

    apply(this.scope_);
  }

  /**
   * @param {SearchEvent} event
   * @private
   */
  handleSearchStart_(event) {
    this['loading'] = true;
  }

  /**
   * @param {SearchEvent} event
   * @private
   */
  handleSearchSuccess_(event) {
    this['loading'] = event.type !== SearchEventType.SUCCESS;
    this.updateResults();

    apply(this.scope_);
  }

  /**
   * Gets the results from the search manager
   *
   * @protected
   */
  updateResults() {
    var sm = SearchManager.getInstance();
    var results = (sm.getResults() || []).slice(0, 20);

    this['results'] = results;
    this['show'] = this['results'].length > 0;
  }

  /**
   * @param {SearchEvent} event
   * @private
   */
  handleAutocomplete_(event) {
    this.clear_();
  }

  /**
   * @param {ISearchResult} result
   * @return {number|string}
   * @export
   */
  track(result) {
    return result.getId();
  }
}
