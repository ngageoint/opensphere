goog.module('os.command.FilterEnable');

const State = goog.require('os.command.State');
const filterManager = goog.require('os.query.FilterManager');
const AbstractFilter = goog.require('os.ui.query.cmd.AbstractFilter');

const FilterEntry = goog.requireType('os.filter.FilterEntry');


/**
 */
class FilterEnable extends AbstractFilter {
  /**
   * Constructor.
   * @param {FilterEntry} filter
   * @param {boolean} enabled
   */
  constructor(filter, enabled) {
    super(filter);

    /**
     * @type {boolean}
     * @private
     */
    this.enabled_ = enabled;

    if (this.filter) {
      this.title = (enabled ? 'Enable' : 'Disable') + ' filter "' + this.filter.getTitle() + '"';
    }
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;

      try {
        filterManager.getInstance().toggle(this.filter, this.enabled_);
        if (!this.enabled_) {
          this.removeEntries();
        }

        this.state = State.SUCCESS;
        return true;
      } catch (e) {
      }
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;

    try {
      filterManager.getInstance().toggle(this.filter, !this.enabled_);
      if (!this.enabled_) {
        this.addEntries();
      }

      this.state = State.READY;
      return true;
    } catch (e) {
    }

    return false;
  }
}

exports = FilterEnable;
