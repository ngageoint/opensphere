goog.provide('os.im.action.cmd.FilterActionAdd');

goog.require('os.command.State');
goog.require('os.im.action.cmd.AbstractFilterAction');



/**
 * Command for adding filter actions.
 * @param {!os.im.action.FilterActionEntry} entry The filter action.
 * @param {number=} opt_index The index in the entry list.
 * @extends {os.im.action.cmd.AbstractFilterAction}
 * @constructor
 */
os.im.action.cmd.FilterActionAdd = function(entry, opt_index) {
  os.im.action.cmd.FilterActionAdd.base(this, 'constructor', entry, opt_index);

  if (entry) {
    var appEntryTitle = os.im.action.ImportActionManager.getInstance().entryTitle;
    this.title = 'Add ' + appEntryTitle + ' "' + entry.getTitle() + '"';
  }
};
goog.inherits(os.im.action.cmd.FilterActionAdd, os.im.action.cmd.AbstractFilterAction);


/**
 * @inheritDoc
 */
os.im.action.cmd.FilterActionAdd.prototype.execute = function() {
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
os.im.action.cmd.FilterActionAdd.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  this.remove();
  this.state = os.command.State.READY;
  return true;
};
