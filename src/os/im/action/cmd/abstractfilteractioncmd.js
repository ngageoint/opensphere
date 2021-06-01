goog.module('os.im.action.cmd.AbstractFilterAction');
goog.module.declareLegacyNamespace();

const State = goog.require('os.command.State');
const ImportActionManager = goog.require('os.im.action.ImportActionManager');

const ICommand = goog.requireType('os.command.ICommand');
const FilterActionEntry = goog.requireType('os.im.action.FilterActionEntry');


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
    this.title = 'Add/Remove ' + ImportActionManager.getInstance().entryTitle;

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
    var entryTitle = ImportActionManager.getInstance().entryTitle || 'Entry';

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
      var iam = ImportActionManager.getInstance();
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
      ImportActionManager.getInstance().removeActionEntry(this.entry, this.parentId);
    }
  }
}

exports = AbstractFilterAction;
