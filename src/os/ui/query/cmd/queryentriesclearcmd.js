goog.declareModuleId('os.ui.query.cmd.QueryEntriesClear');

import QueryEntries from './queryentriescmd.js';


/**
 * Command to clear all query entries
 */
export default class QueryEntriesClear extends QueryEntries {
  /**
   * Constructor.
   */
  constructor() {
    super([]);
    this.title = 'Clear query entries';
  }
}
