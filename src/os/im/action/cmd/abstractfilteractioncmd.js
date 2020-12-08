goog.module('os.im.action.cmd.AbstractFilterAction');
goog.module.declareLegacyNamespace();

goog.require('os.ui.query.cmd.QueryEntries');

const State = goog.require('os.command.State');
const ICommand = goog.requireType('os.command.ICommand');



/**
 * Abstract command for adding/removing filter actions.
 *
 * @abstract
 * @implements {ICommand}
 */
class AbstractFilterAction {
  /**
   * Constructor.
   * @param {!os.im.action.FilterActionEntry} entry The filter action.
   * @param {number=} opt_index The index in the entry list.
   * @param {string=} opt_parentId The parent node ID.
   */
  constructor(entry, opt_index, opt_parentId) {
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
     * @type {State}
     */
    this.state = State.READY;
  }

  /**
   * @abstract
   * @inheritDoc
   */
  execute() {}

  /**
   * @abstract
   * @inheritDoc
   */
  revert() {}

  /**
   * Tests whether or not the command is ready and able to execute.
   *
   * @return {boolean} True if ready, false otherwise.
   * @protected
   */
  canExecute() {
    var entryTitle = os.im.action.ImportActionManager.getInstance().entryTitle || 'Entry';

    if (this.state !== State.READY) {
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
  }

  /**
   * Adds the filter action.
   *
   * @protected
   */
  add() {
    if (this.entry) {
      var iam = os.im.action.ImportActionManager.getInstance();
      iam.addActionEntry(this.entry, this.index, this.parentId);
      iam.processItems(this.entry.getType());
    }
  }

  /**
   * Removes the filter action.
   *
   * @protected
   */
  remove() {
    if (this.entry) {
      os.im.action.ImportActionManager.getInstance().removeActionEntry(this.entry, this.parentId);
    }
  }
}

exports = AbstractFilterAction;
