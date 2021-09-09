goog.module('os.im.action.cmd.AbstractFilterAction');

const State = goog.require('os.command.State');
const {getImportActionManager} = goog.require('os.im.action');

const ICommand = goog.requireType('os.command.ICommand');
const FilterActionEntry = goog.requireType('os.im.action.FilterActionEntry');
const ImportActionManager = goog.requireType('os.im.action.ImportActionManager');


/**
 * Abstract command for adding/removing filter actions.
 *
 * @abstract
 * @implements {ICommand}
 */
class AbstractFilterAction {
  /**
   * Constructor.
   * @param {!FilterActionEntry} entry The filter action.
   * @param {number=} opt_index The index in the entry list.
   * @param {string=} opt_parentId The parent node ID.
   */
  constructor(entry, opt_index, opt_parentId) {
    /**
     * The import manager instance.
     * @type {ImportActionManager}
     * @protected
     */
    this.manager = getImportActionManager();

    /**
     * The filter action entry title.
     * @type {string}
     * @protected
     */
    this.entryTitle = this.manager ? this.manager.entryTitle : 'Entry';

    /**
     * @type {!FilterActionEntry}
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
    this.title = 'Add/Remove ' + this.entryTitle;

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
    if (!this.manager) {
      this.details = 'No import action manager available';
      return false;
    }

    var entryTitle = this.manager.entryTitle || 'Entry';

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
    if (this.entry && this.manager) {
      var iam = this.manager;
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
    if (this.entry && this.manager) {
      this.manager.removeActionEntry(this.entry, this.parentId);
    }
  }
}

exports = AbstractFilterAction;
