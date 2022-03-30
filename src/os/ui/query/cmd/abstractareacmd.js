goog.declareModuleId('os.ui.query.cmd.AbstractArea');

import State from '../../../command/state.js';
import {getQueryManager} from '../../../query/queryinstance.js';

const Disposable = goog.require('goog.Disposable');

const {default: ICommand} = goog.requireType('os.command.ICommand');


/**
 * Abstract command for adding/removing area
 *
 * @abstract
 * @implements {ICommand}
 */
export default class AbstractArea extends Disposable {
  /**
   * Constructor.
   * @param {!Feature} area
   */
  constructor(area) {
    super();

    /**
     * @inheritDoc
     */
    this.isAsync = false;

    /**
     * @inheritDoc
     */
    this.title = 'Add/Remove Area';

    /**
     * @inheritDoc
     */
    this.details = null;

    /**
     * @inheritDoc
     */
    this.state = State.READY;

    /**
     * @type {!Feature}
     * @protected
     */
    this.area = area;

    var qm = getQueryManager();

    /**
     * @type {!Array<Object<string, string|boolean>>}
     * @protected
     */
    this.entries = area.getId() ? qm.getEntries(null, /** @type {string} */ (area.getId())) : [];

    /**
     * @type {boolean}
     * @protected
     */
    this.include = qm.isInclusion(area);

    /**
     * @type {boolean}
     * @protected
     */
    this.exclude = qm.isExclusion(area);

    /**
     * @type {boolean}
     * @protected
     */
    this.append = true;
  }

  /**
   * Checks if the command is ready to execute.
   *
   * @return {boolean}
   */
  canExecute() {
    if (this.state !== State.READY) {
      this.details = 'Command not in ready state.';
      return false;
    }

    if (!this.area) {
      this.details = 'No area provided.';
      return false;
    }

    return true;
  }
}
