goog.module('os.im.action.cmd.FilterActionRemove');

const State = goog.require('os.command.State');
const AbstractFilterAction = goog.require('os.im.action.cmd.AbstractFilterAction');

const FilterActionEntry = goog.requireType('os.im.action.FilterActionEntry');


/**
 * Command for removing filter actions.
 */
class FilterActionRemove extends AbstractFilterAction {
  /**
   * Constructor.
   * @param {!FilterActionEntry} entry The filter action.
   * @param {number=} opt_index The index in the entry list.
   * @param {string=} opt_parentId The parent node ID.
   */
  constructor(entry, opt_index, opt_parentId) {
    super(entry, opt_index, opt_parentId);

    if (entry) {
      this.title = 'Remove ' + this.entryTitle + ' "' + entry.getTitle() + '"';
    }
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;

      this.remove();
      this.state = State.SUCCESS;
      return true;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;

    this.add();
    this.state = State.READY;
    return true;
  }
}

exports = FilterActionRemove;
