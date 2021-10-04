goog.declareModuleId('os.command.AreaToggle');

import {getAreaManager} from '../query/queryinstance.js';
import AbstractArea from '../ui/query/cmd/abstractareacmd.js';
import State from './state.js';

const {default: ICommand} = goog.requireType('os.command.ICommand');


/**
 * Command for toggling an area
 *
 * @implements {ICommand}
 */
export default class AreaToggle extends AbstractArea {
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
