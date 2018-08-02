goog.provide('os.command.FilterEnable');
goog.require('os.command.State');
goog.require('os.filter.FilterEntry');
goog.require('os.query.FilterManager');
goog.require('os.ui.query.cmd.AbstractFilter');



/**
 * @extends {os.ui.query.cmd.AbstractFilter}
 * @constructor
 * @param {os.filter.FilterEntry} filter
 * @param {boolean} enabled
 */
os.command.FilterEnable = function(filter, enabled) {
  os.command.FilterEnable.base(this, 'constructor', filter);

  /**
   * @type {boolean}
   * @private
   */
  this.enabled_ = enabled;

  if (this.filter) {
    this.title = (enabled ? 'Enable' : 'Disable') + ' filter "' + this.filter.getTitle() + '"';
  }
};
goog.inherits(os.command.FilterEnable, os.ui.query.cmd.AbstractFilter);


/**
 * @inheritDoc
 */
os.command.FilterEnable.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;

    try {
      os.ui.filterManager.toggle(this.filter, this.enabled_);
      if (!this.enabled_) {
        this.removeEntries();
      }

      this.state = os.command.State.SUCCESS;
      return true;
    } catch (e) {
    }
  }

  return false;
};


/**
 * @inheritDoc
 */
os.command.FilterEnable.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  try {
    os.ui.filterManager.toggle(this.filter, !this.enabled_);
    if (!this.enabled_) {
      this.addEntries();
    }

    this.state = os.command.State.READY;
    return true;
  } catch (e) {
  }

  return false;
};
