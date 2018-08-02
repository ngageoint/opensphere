goog.provide('os.ui.query.cmd.AbstractFilter');

goog.require('os.command.ICommand');
goog.require('os.command.State');
goog.require('os.filter.FilterEntry');
goog.require('os.ui.query.cmd.QueryEntries');



/**
 * Abstract command for adding/removing filters
 * @implements {os.command.ICommand}
 * @constructor
 * @param {os.filter.FilterEntry} filter
 */
os.ui.query.cmd.AbstractFilter = function(filter) {
  /**
   * @type {os.filter.FilterEntry}
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
   * @type {os.command.State}
   */
  this.state = os.command.State.READY;

  /**
   * @type {!Array<!Object<string, string|boolean>>}
   */
  this.entries = os.ui.queryManager.getEntries(null, null, this.filter.getId());
};


/**
 * @inheritDoc
 */
os.ui.query.cmd.AbstractFilter.prototype.execute = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.ui.query.cmd.AbstractFilter.prototype.revert = goog.abstractMethod;


/**
 * Tests whether or not the command is ready and able to execute
 * @return {boolean} True if ready, false otherwise
 */
os.ui.query.cmd.AbstractFilter.prototype.canExecute = function() {
  if (this.state !== os.command.State.READY) {
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
};


/**
 * Adds the filter
 */
os.ui.query.cmd.AbstractFilter.prototype.add = function() {
  os.ui.filter.FilterManager.getInstance().addFilter(this.filter);
  this.addEntries();
};


/**
 * Removes the filter
 */
os.ui.query.cmd.AbstractFilter.prototype.remove = function() {
  this.removeEntries();
  os.ui.filter.FilterManager.getInstance().removeFilter(this.filter);
};


/**
 * Adds the filter entries
 */
os.ui.query.cmd.AbstractFilter.prototype.addEntries = function() {
  if (this.entries && this.entries.length > 0) {
    os.ui.queryManager.addEntries(this.entries, true, this.filter.getType());
  }
};


/**
 * Removes the filter entries
 */
os.ui.query.cmd.AbstractFilter.prototype.removeEntries = function() {
  if (this.entries && this.entries.length > 0) {
    os.ui.queryManager.removeEntries(null, null, this.filter.getId());
  }
};
