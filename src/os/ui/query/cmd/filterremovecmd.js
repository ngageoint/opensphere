goog.provide('os.ui.query.cmd.FilterRemove');
goog.require('os.command.State');
goog.require('os.ui.query.cmd.AbstractFilter');



/**
 * @extends {os.ui.query.cmd.AbstractFilter}
 * @constructor
 * @param {os.filter.FilterEntry} filter
 */
os.ui.query.cmd.FilterRemove = function(filter) {
  os.ui.query.cmd.FilterRemove.base(this, 'constructor', filter);

  if (this.filter) {
    this.title = 'Remove filter "' + this.filter.getTitle() + '"';
  }
};
goog.inherits(os.ui.query.cmd.FilterRemove, os.ui.query.cmd.AbstractFilter);


/**
 * @inheritDoc
 */
os.ui.query.cmd.FilterRemove.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;

    this.remove();
    this.state = os.command.State.SUCCESS;
    return true;
  }

  return false;
};


/**
 * @inheritDoc
 */
os.ui.query.cmd.FilterRemove.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  this.add();
  this.state = os.command.State.READY;
  return true;
};
