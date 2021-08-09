goog.module('os.ui.query.cmd.FilterRemove');
goog.module.declareLegacyNamespace();

const State = goog.require('os.command.State');
const AbstractFilter = goog.require('os.ui.query.cmd.AbstractFilter');

const FilterEntry = goog.requireType('os.filter.FilterEntry');


/**
 */
class FilterRemove extends AbstractFilter {
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

exports = FilterRemove;
