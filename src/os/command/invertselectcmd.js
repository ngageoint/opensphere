goog.module('os.command.InvertSelect');

const AbstractSource = goog.require('os.command.AbstractSource');
const State = goog.require('os.command.State');

const ICommand = goog.requireType('os.command.ICommand');


/**
 * Inverts the selection on a source
 *
 * @implements {ICommand}
 */
class InvertSelect extends AbstractSource {
  /**
   * Constructor.
   * @param {!string} sourceId
   */
  constructor(sourceId) {
    super(sourceId);

    var source = this.getSource();
    if (source) {
      this.title = 'Invert selection on "' + source.getTitle() + '"';
    }
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;
      this.invert_();
      this.state = State.SUCCESS;
      return true;
    }

    return false;
  }

  /**
   * Inverts the selection on the source
   *
   * @private
   */
  invert_() {
    var source = this.getSource();
    if (source) {
      source.setSelectedItems(source.getUnselectedItems());
    }
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;
    this.invert_();
    this.state = State.READY;
    return true;
  }
}

exports = InvertSelect;
