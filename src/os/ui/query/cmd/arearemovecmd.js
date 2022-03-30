goog.declareModuleId('os.ui.query.cmd.AreaRemove');

import State from '../../../command/state.js';
import {getAreaManager, getQueryManager} from '../../../query/queryinstance.js';
import AbstractArea from './abstractareacmd.js';

const {default: ICommand} = goog.requireType('os.command.ICommand');


/**
 * Command for removing an area
 *
 * @implements {ICommand}
 */
export default class AreaRemove extends AbstractArea {
  /**
   * Constructor.
   * @param {!Feature} area
   */
  constructor(area) {
    super(area);
    this.title = 'Remove area';

    if (area) {
      var areaTitle = area.get('title');
      if (areaTitle) {
        this.title += ' "' + areaTitle + '"';
      }
    }
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;

      var am = getAreaManager();
      var qm = getQueryManager();

      if (this.entries) {
        qm.removeEntriesArr(this.entries);
      }

      am.remove(this.area);

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
    var qm = getQueryManager();

    am.add(this.area);
    qm.addEntries(this.entries);

    this.state = State.READY;
    return true;
  }
}
