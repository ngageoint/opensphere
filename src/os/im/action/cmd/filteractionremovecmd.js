goog.provide('os.im.action.cmd.FilterActionRemove');

goog.require('os.command.State');
goog.require('os.im.action.cmd.AbstractFilterAction');



/**
 * Command for removing filter actions.
 * @param {!os.im.action.FilterActionEntry} entry The filter action.
 * @param {number=} opt_index The index in the entry list.
 * @extends {os.im.action.cmd.AbstractFilterAction}
 * @constructor
 */
os.im.action.cmd.FilterActionRemove = function(entry, opt_index) {
  os.im.action.cmd.FilterActionRemove.base(this, 'constructor', entry, opt_index);

  if (entry) {
    var appEntryTitle = os.im.action.ImportActionManager.getInstance().entryTitle;
    this.title = 'Remove ' + appEntryTitle + ' "' + entry.getTitle() + '"';
  }
};
goog.inherits(os.im.action.cmd.FilterActionRemove, os.im.action.cmd.AbstractFilterAction);


/**
 * @inheritDoc
 */
os.im.action.cmd.FilterActionRemove.prototype.execute = function() {
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
os.im.action.cmd.FilterActionRemove.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  this.add();
  this.state = os.command.State.READY;
  return true;
};
