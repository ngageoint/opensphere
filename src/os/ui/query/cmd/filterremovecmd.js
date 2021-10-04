goog.declareModuleId('os.ui.query.cmd.FilterRemove');

import State from '../../../command/state.js';
import AbstractFilter from './abstractfiltercmd.js';

const {default: FilterEntry} = goog.requireType('os.filter.FilterEntry');


/**
 */
export default class FilterRemove extends AbstractFilter {
  /**
   * Constructor.
   * @param {FilterEntry} filter
   */
  constructor(filter) {
    super(filter);

    if (this.filter) {
      this.title = 'Remove filter "' + this.filter.getTitle() + '"';
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
