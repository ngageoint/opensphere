goog.provide('os.im.action.cmd.AbstractFilterAction');

goog.require('os.command.ICommand');
goog.require('os.command.State');
goog.require('os.ui.query.cmd.QueryEntries');



/**
 * Abstract command for adding/removing filter actions.
 *
 * @abstract
 * @param {!os.im.action.FilterActionEntry} entry The filter action.
 * @param {number=} opt_index The index in the entry list.
 * @param {string=} opt_parentId The parent node ID.
 * @implements {os.command.ICommand}
 * @constructor
 */
os.im.action.cmd.AbstractFilterAction = function(entry, opt_index, opt_parentId) {
  /**
   * @type {!os.im.action.FilterActionEntry}
   * @protected
   */
  this.entry = entry;

  /**
   * The index for add operations.
   * @type {number|undefined}
   */
  this.index = opt_index;

  /**
   * The parent node ID to add to (as opposed to the manager itself).
   * @type {string|undefined}
   * @protected
   */
  this.parentId = opt_parentId;

  /**
   * @type {boolean}
   */
  this.isAsync = false;

  /**
   * @type {string}
   */
  this.title = 'Add/Remove ' + os.im.action.ImportActionManager.getInstance().entryTitle;

  /**
   * @type {?string}
   */
  this.details = null;

  /**
   * @type {os.command.State}
   */
  this.state = os.command.State.READY;
};


/**
 * @abstract
 * @inheritDoc
 */
os.im.action.cmd.AbstractFilterAction.prototype.execute = function() {};


/**
 * @abstract
 * @inheritDoc
 */
os.im.action.cmd.AbstractFilterAction.prototype.revert = function() {};


/**
 * Tests whether or not the command is ready and able to execute.
 *
 * @return {boolean} True if ready, false otherwise.
 * @protected
 */
os.im.action.cmd.AbstractFilterAction.prototype.canExecute = function() {
  var entryTitle = os.im.action.ImportActionManager.getInstance().entryTitle || 'Entry';

  if (this.state !== os.command.State.READY) {
    this.details = 'Command not in ready state';
    return false;
  }

  if (!this.entry) {
    this.details = entryTitle + ' not provided';
    return false;
  }

  if (!this.entry.type) {
    this.details = entryTitle + ' type not set';
    return false;
  }

  if (!this.entry.getFilter()) {
    this.details = entryTitle + ' does not contain a filter';
    return false;
  }

  return true;
};


/**
 * Adds the filter action.
 *
 * @protected
 */
os.im.action.cmd.AbstractFilterAction.prototype.add = function() {
  if (this.entry) {
    os.im.action.ImportActionManager.getInstance().addActionEntry(this.entry, this.index, this.parentId);
  }
};


/**
 * Removes the filter action.
 *
 * @protected
 */
os.im.action.cmd.AbstractFilterAction.prototype.remove = function() {
  if (this.entry) {
    os.im.action.ImportActionManager.getInstance().removeActionEntry(this.entry, this.parentId);
  }
};
