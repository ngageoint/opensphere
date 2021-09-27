goog.declareModuleId('os.ui.query.cmd.AbstractFilter');

const State = goog.require('os.command.State');
const {getFilterManager, getQueryManager} = goog.require('os.query.instance');

const ICommand = goog.requireType('os.command.ICommand');
const FilterEntry = goog.requireType('os.filter.FilterEntry');


/**
 * Abstract command for adding/removing filters
 *
 * @abstract
 * @implements {ICommand}
 */
export default class AbstractFilter {
  /**
   * Constructor.
   * @param {FilterEntry} filter
   */
  constructor(filter) {
    /**
     * @type {FilterEntry}
     * @protected
     */
    this.filter = filter;

    /**
     * @type {boolean}
     */
    this.isAsync = false;

    /**
     * @type {string}
     */
    this.title = 'Add/Remove filter';

    /**
     * @type {?string}
     */
    this.details = null;

    /**
     * @type {State}
     */
    this.state = State.READY;

    /**
     * @type {!Array<!Object<string, string|boolean>>}
     */
    this.entries = getQueryManager().getEntries(null, null, this.filter.getId());
  }

  /**
   * Tests whether or not the command is ready and able to execute
   *
   * @return {boolean} True if ready, false otherwise
   */
  canExecute() {
    if (this.state !== State.READY) {
      this.details = 'Command not in ready state';
      return false;
    }

    if (!this.filter) {
      this.details = 'Filter not provided';
      return false;
    }

    if (!this.filter.type) {
      this.details = 'Filter type not set';
      return false;
    }

    if (!this.filter.getFilter()) {
      this.details = 'Filter entry does not contain a filter';
      return false;
    }

    return true;
  }

  /**
   * Adds the filter
   */
  add() {
    getFilterManager().addFilter(this.filter);
    this.addEntries();
  }

  /**
   * Removes the filter
   */
  remove() {
    this.removeEntries();
    getFilterManager().removeFilter(this.filter);
  }

  /**
   * Adds the filter entries
   */
  addEntries() {
    if (this.entries && this.entries.length > 0) {
      getQueryManager().addEntries(this.entries, true, this.filter.getType());
    }
  }

  /**
   * Removes the filter entries
   */
  removeEntries() {
    if (this.entries && this.entries.length > 0) {
      getQueryManager().removeEntries(null, null, this.filter.getId());
    }
  }
}
