goog.declareModuleId('os.ui.search.SearchScrollDataSource');

const EventTarget = goog.require('goog.events.EventTarget');
const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');
const SearchEvent = goog.require('os.search.SearchEvent');
const SearchEventType = goog.require('os.search.SearchEventType');

const SearchManager = goog.requireType('os.search.SearchManager');
const {default: IScrollDataSource} = goog.requireType('os.ui.IScrollDataSource');


/**
 * @implements {IScrollDataSource}
 * @unrestricted
 */
export default class SearchScrollDataSource extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();
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
     * @type {SearchManager}
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
  }

  /**
   * @inheritDoc
   */
  setDataSource(dataSource) {
    // deregister any old event handlers
    if (this.dataSource_) {
      this.dataSource_.unlisten(
          SearchEventType.SUCCESS,
          this.handleSearchSuccess);
      this.dataSource_.unlisten(
          SearchEventType.ERROR,
          this.handleSearchFailure,
          false,
          this);
      this.dataSource_.unlisten(
          SearchEventType.START,
          this.handleSearchStart);
    }

    this.dataSource_ = dataSource;

    if (this.dataSource_) {
      // register event handler to process search results
      this.dataSource_.listen(
          SearchEventType.SUCCESS,
          this.handleSearchSuccess,
          false,
          this);
      this.dataSource_.listen(
          SearchEventType.ERROR,
          this.handleSearchFailure,
          false,
          this);
      this.dataSource_.listen(
          SearchEventType.START,
          this.handleSearchStart,
          false,
          this);
    }
  }

  /**
   * The search term used to update results
   *
   * @param {string} term
   */
  setTerm(term) {
    this.term_ = term;
    this.update();
    if (!term) {
      this.dataSource_.clear();
    }
  }

  /**
   * @inheritDoc
   */
  update() {
    this.revision_ += 1;
  }

  /**
   * @inheritDoc
   */
  getRevision() {
    return this.revision_;
  }

  /**
   * @inheritDoc
   */
  getData(index, count, onSuccess) {
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
  }

  /**
   * @inheritDoc
   */
  isLoading() {
    return this.loading_;
  }

  /**
   * Handle search success by extracting results and making them available to clients
   *
   * @param {SearchEvent} event
   */
  handleSearchStart(event) {
    this.dispatchEvent(new SearchEvent(SearchEventType.START, this.term_, [], 0));
  }

  /**
   * Handle search success by extracting results and making them available to clients
   *
   * @param {SearchEvent} event
   */
  handleSearchSuccess(event) {
    this.loading_ = false;
    // ensure the term is set
    if (this.term_ !== event.getSearchTerm() && !isEmptyOrWhitespace(makeSafe(event.getTerm()))) {
      this.setTerm(event.getSearchTerm() || '');
    }

    var results = event.getResults();
    if (this.appendResultsCallback_) {
      this.appendResultsCallback_(results);
    }

    this.dispatchEvent(new SearchEvent(
        SearchEventType.SUCCESS,
        this.term_,
        results,
        event.getTotal()));
  }

  /**
   * Handle search failure by extracting results and making them available to clients
   *
   * @param {SearchEvent} event
   */
  handleSearchFailure(event) {
    this.loading_ = false;
    this.dispatchEvent(new SearchEvent(SearchEventType.ERROR, this.term_, [], 0));
  }
}
