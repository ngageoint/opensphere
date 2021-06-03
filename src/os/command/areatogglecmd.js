goog.module('os.command.AreaToggle');
goog.module.declareLegacyNamespace();

const areaManager = goog.require('os.query.AreaManager');
const AbstractArea = goog.require('os.ui.query.cmd.AbstractArea');

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
      this.state = os.command.State.EXECUTING;
      var am = areaManager.getInstance();

      am.toggle(this.area, this.show_);

      this.state = os.command.State.SUCCESS;
      return true;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = os.command.State.REVERTING;
    var am = areaManager.getInstance();

    am.toggle(this.area, !this.show_);

    this.state = os.command.State.READY;
    return true;
  }
}

exports = AreaToggle;
