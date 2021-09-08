goog.module('os.ui.query.cmd.QueryEntriesClear');

const QueryEntries = goog.require('os.ui.query.cmd.QueryEntries');


/**
 * Command to clear all query entries
 */
class QueryEntriesClear extends QueryEntries {
  /**
   * Constructor.
   */
  constructor() {
    super([]);
    this.title = 'Clear query entries';
  }
}

exports = QueryEntriesClear;
