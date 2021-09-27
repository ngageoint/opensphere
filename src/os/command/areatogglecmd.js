goog.module('os.command.AreaToggle');

const State = goog.require('os.command.State');
const {getAreaManager} = goog.require('os.query.instance');
const {default: AbstractArea} = goog.require('os.ui.query.cmd.AbstractArea');

const ICommand = goog.requireType('os.command.ICommand');


/**
 * Command for toggling an area
 *
 * @implements {ICommand}
 */
class AreaToggle extends AbstractArea {
  /**
   * Constructor.
   * @param {!ol.Feature} area
   * @param {boolean} show
   */
  constructor(area, show) {
    super(area);

    /**
     * @type {boolean}
     * @private
     */
    this.show_ = show;
    this.title = 'Toggle area' + ' ' + (show ? 'on' : 'off');
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;
      var am = getAreaManager();

      am.toggle(this.area, this.show_);

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
    var am = getAreaManager();

    am.toggle(this.area, !this.show_);

    this.state = State.READY;
    return true;
  }
}

exports = AreaToggle;
