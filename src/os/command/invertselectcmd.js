goog.declareModuleId('os.command.InvertSelect');

import AbstractSource from './abstractsourcecmd.js';
import State from './state.js';

const {default: ICommand} = goog.requireType('os.command.ICommand');


/**
 * Inverts the selection on a source
 *
 * @implements {ICommand}
 */
export default class InvertSelect extends AbstractSource {
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
