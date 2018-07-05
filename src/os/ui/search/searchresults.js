goog.provide('os.ui.search.SearchResultsCtrl');
goog.provide('os.ui.search.searchResultsDirective');

goog.require('os.defines');
goog.require('os.search.SearchEvent');
goog.require('os.search.SearchEventType');
goog.require('os.ui');
goog.require('os.ui.Module');
goog.require('os.ui.dragDropDirective');
goog.require('os.ui.search.resultCardDirective');


/**
 * The searchresults directive
 * @return {angular.Directive}
 */
os.ui.search.searchResultsDirective = function() {
  return {
    restrict: 'E',
    scope: true,
    replace: true,
    transclude: true,
    templateUrl: os.ROOT + 'views/search/searchresults.html',
    controller: os.ui.search.SearchResultsCtrl,
    controllerAs: 'searchResults'
  };
};


/**
 * Register the searchresults directive.
 */
os.ui.Module.directive('searchresults', [os.ui.search.searchResultsDirective]);



/**
 * Controller function for the searchresults directive.
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.search.SearchResultsCtrl = function($scope) {
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
   * @type {Array.<os.search.ISearchResult>}
   */
  this['results'] = [];

  /**
   * @type {boolean}
   */
  this['loading'] = false;

  var sm = os.search.SearchManager.getInstance();
  sm.listen(os.search.SearchEventType.START, this.handleSearchStart_, false, this);
  sm.listen(os.search.SearchEventType.SUCCESS, this.handleSearchSuccess_, false, this);
  sm.listen(os.search.SearchEventType.PROGRESS, this.handleSearchSuccess_, false, this);
  sm.listen(os.search.SearchEventType.AUTOCOMPLETED, this.handleAutocomplete_, false, this);

  $scope.$on('$destroy', this.destroy_.bind(this));
  this.updateResults();
};


/**
 * @private
 */
os.ui.search.SearchResultsCtrl.prototype.destroy_ = function() {
  var sm = os.search.SearchManager.getInstance();
  sm.unlisten(os.search.SearchEventType.START, this.handleSearchStart_, false, this);
  sm.unlisten(os.search.SearchEventType.SUCCESS, this.handleSearchSuccess_, false, this);
  sm.unlisten(os.search.SearchEventType.PROGRESS, this.handleSearchSuccess_, false, this);
  sm.unlisten(os.search.SearchEventType.AUTOCOMPLETED, this.handleAutocomplete_, false, this);

  this.scope_ = null;
};


/**
 * Clears the search results.
 * @private
 */
os.ui.search.SearchResultsCtrl.prototype.clear_ = function() {
  this['results'].length = 0;
  this['show'] = false;

  os.ui.apply(this.scope_);
};


/**
 * @param {os.search.SearchEvent} event
 * @private
 */
os.ui.search.SearchResultsCtrl.prototype.handleSearchStart_ = function(event) {
  this['loading'] = true;
};


/**
 * @param {os.search.SearchEvent} event
 * @private
 */
os.ui.search.SearchResultsCtrl.prototype.handleSearchSuccess_ = function(event) {
  this['loading'] = event.type !== os.search.SearchEventType.SUCCESS;
  this.updateResults();

  os.ui.apply(this.scope_);
};


/**
 * Gets the results from the search manager
 * @protected
 */
os.ui.search.SearchResultsCtrl.prototype.updateResults = function() {
  var sm = os.search.SearchManager.getInstance();
  var results = (sm.getResults() || []).slice(0, 20);

  this['results'] = results;
  this['show'] = this['results'].length > 0;
};


/**
 * @param {os.search.SearchEvent} event
 * @private
 */
os.ui.search.SearchResultsCtrl.prototype.handleAutocomplete_ = function(event) {
  this.clear_();
};


/**
 * @param {os.search.ISearchResult} result
 * @return {number|string}
 */
os.ui.search.SearchResultsCtrl.prototype.track = function(result) {
  return result.getId();
};
goog.exportProperty(os.ui.search.SearchResultsCtrl.prototype, 'track',
    os.ui.search.SearchResultsCtrl.prototype.track);
