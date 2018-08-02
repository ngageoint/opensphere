goog.provide('os.ui.query.cmd.FilterAdd');
goog.require('os.command.State');
goog.require('os.ui.query.cmd.AbstractFilter');



/**
 * @extends {os.ui.query.cmd.AbstractFilter}
 * @constructor
 * @param {os.filter.FilterEntry} filter
 */
os.ui.query.cmd.FilterAdd = function(filter) {
  os.ui.query.cmd.FilterAdd.base(this, 'constructor', filter);

  if (this.filter) {
    this.title = 'Add Filter "' + this.filter.getTitle() + '"';
  }
};
goog.inherits(os.ui.query.cmd.FilterAdd, os.ui.query.cmd.AbstractFilter);


/**
 * @inheritDoc
 */
os.ui.query.cmd.FilterAdd.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;

    this.add();
    this.state = os.command.State.SUCCESS;
    return true;
  }

  return false;
};


/**
 * @inheritDoc
 */
os.ui.query.cmd.FilterAdd.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  this.remove();
  this.state = os.command.State.READY;
  return true;
};
