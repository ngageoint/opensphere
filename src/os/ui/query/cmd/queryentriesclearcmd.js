goog.provide('os.ui.query.cmd.QueryEntriesClear');

goog.require('os.ui.query.cmd.QueryEntries');



/**
 * Command to clear all query entries
 * @extends {os.ui.query.cmd.QueryEntries}
 * @constructor
 */
os.ui.query.cmd.QueryEntriesClear = function() {
  os.ui.query.cmd.QueryEntriesClear.base(this, 'constructor', []);
  this.title = 'Clear query entries';
};
goog.inherits(os.ui.query.cmd.QueryEntriesClear, os.ui.query.cmd.QueryEntries);
