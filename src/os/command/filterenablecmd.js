goog.declareModuleId('os.command.FilterEnable');

import filterManager from '../query/filtermanager.js';
import AbstractFilter from '../ui/query/cmd/abstractfiltercmd.js';
import State from './state.js';

const {default: FilterEntry} = goog.requireType('os.filter.FilterEntry');


/**
 */
export default class FilterEnable extends AbstractFilter {
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
