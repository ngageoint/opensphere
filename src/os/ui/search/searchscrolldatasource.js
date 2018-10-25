goog.provide('os.ui.search.SearchScrollDataSource');
goog.require('goog.events.EventTarget');
goog.require('os.search.SearchEvent');
goog.require('os.search.SearchEventType');
goog.require('os.search.SearchManager');
goog.require('os.ui.IScrollDataSource');



/**
 * @extends {goog.events.EventTarget}
 * @implements {os.ui.IScrollDataSource}
 * @constructor
 */
os.ui.search.SearchScrollDataSource = function() {
  os.ui.search.SearchScrollDataSource.base(this, 'constructor');
  /**
   * @private
   * @type {?string}
   */
  this.term_ = null;
  /**
   * @private
   * @type {number}
   */
  this.revision_ = 0;
  /**
   * @private
   * @type {os.search.SearchManager}
   */
  this.dataSource_ = null;
  /**
   * @private
   * @type {Function}
   */
  this.appendResultsCallback_ = null;
  /**
   * @private
   * @type {boolean}
   */
  this.loading_ = false;

  // expose these for ui-scroll, bound in the correct context
  this['get'] = this.getData.bind(this);
  this['loading'] = this.isLoading.bind(this);
  this['revision'] = this.getRevision.bind(this);
};
goog.inherits(os.ui.search.SearchScrollDataSource, goog.events.EventTarget);


/**
 * Set the data source which will execute the search
 * @param {os.search.SearchManager} dataSource
 */
os.ui.search.SearchScrollDataSource.prototype.setDataSource = function(dataSource) {
  // deregister any old event handlers
  if (this.dataSource_) {
    this.dataSource_.unlisten(
        os.search.SearchEventType.SUCCESS,
        this.handleSearchSuccess);
    this.dataSource_.unlisten(
        os.search.SearchEventType.ERROR,
        this.handleSearchFailure,
        false,
        this);
    this.dataSource_.unlisten(
        os.search.SearchEventType.START,
        this.handleSearchStart);
  }

  this.dataSource_ = dataSource;

  if (this.dataSource_) {
    // register event handler to process search results
    this.dataSource_.listen(
        os.search.SearchEventType.SUCCESS,
        this.handleSearchSuccess,
        false,
        this);
    this.dataSource_.listen(
        os.search.SearchEventType.ERROR,
        this.handleSearchFailure,
        false,
        this);
    this.dataSource_.listen(
        os.search.SearchEventType.START,
        this.handleSearchStart,
        false,
        this);
  }
};


/**
 * The search term used to update results
 * @param {string} term
 */
os.ui.search.SearchScrollDataSource.prototype.setTerm = function(term) {
  this.term_ = term;
  this.update();
  if (!term) {
    this.dataSource_.clear();
  }
};


/**
 * @inheritDoc
 */
os.ui.search.SearchScrollDataSource.prototype.update = function() {
  this.revision_ += 1;
};


/**
 * @inheritDoc
 */
os.ui.search.SearchScrollDataSource.prototype.getRevision = function() {
  return this.revision_;
};


/**
 * @inheritDoc
 */
os.ui.search.SearchScrollDataSource.prototype.getData = function(index, count, onSuccess) {
  index = index - 1;
  if (index < 0 && count + index > 0) {
    // negative index searches backwards in the data source, but we always want to start from 0
    // normalize the requests so we always start at a minimum of zero by adjusting the count
    count = count + index;
    index = 0;
  }

  // must have a source, term, 0+ index, and positive count to search
  if (this.dataSource_ && this.term_ && index >= 0 && count > 0) {
    this.loading_ = true;
    this.appendResultsCallback_ = onSuccess;
    this.dataSource_.search(this.term_, index, count);
  } else {
    onSuccess([]);
  }
};


/**
 * @inheritDoc
 */
os.ui.search.SearchScrollDataSource.prototype.isLoading = function() {
  return this.loading_;
};


/**
 * Handle search success by extracting results and making them available to clients
 * @param {os.search.SearchEvent} event
 */
os.ui.search.SearchScrollDataSource.prototype.handleSearchStart = function(event) {
  this.dispatchEvent(new os.search.SearchEvent(os.search.SearchEventType.START, this.term_, [], 0));
};


/**
 * Handle search success by extracting results and making them available to clients
 * @param {os.search.SearchEvent} event
 */
os.ui.search.SearchScrollDataSource.prototype.handleSearchSuccess = function(event) {
  this.loading_ = false;
  // ensure the term is set
  if (this.term_ !== event.getSearchTerm() && !goog.string.isEmptyOrWhitespace(event.getTerm())) {
    this.setTerm(event.getSearchTerm() || '');
  }

  var results = event.getResults();
  if (this.appendResultsCallback_) {
    this.appendResultsCallback_(results);
  }

  this.dispatchEvent(new os.search.SearchEvent(
      os.search.SearchEventType.SUCCESS,
      this.term_,
      results,
      event.getTotal()));
};


/**
 * Handle search failure by extracting results and making them available to clients
 * @param {os.search.SearchEvent} event
 */
os.ui.search.SearchScrollDataSource.prototype.handleSearchFailure = function(event) {
  this.loading_ = false;
  this.dispatchEvent(new os.search.SearchEvent(os.search.SearchEventType.ERROR, this.term_, [], 0));
};
