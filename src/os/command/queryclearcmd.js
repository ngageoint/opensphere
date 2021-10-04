goog.declareModuleId('os.command.QueryClear');

import {getAreaManager} from '../query/queryinstance.js';
import State from './state.js';

const {default: ICommand} = goog.requireType('os.command.ICommand');


/**
 * Command for clearing spatial queries on the map.
 *
 * @implements {ICommand}
 */
export default class QueryClear {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @inheritDoc
     */
    this.isAsync = false;

    /**
     * @inheritDoc
     */
    this.title = 'Clear query areas';

    /**
     * @inheritDoc
     */
    this.details = null;

    /**
     * @inheritDoc
     */
    this.state = State.READY;

    /**
     * @type {!Object<number|string|undefined, boolean>}
     * @private
     */
    this.ids_ = {};

    /**
     * @type {boolean}
     * @protected
     */
    this.value = true;
  }

  /**
   * @inheritDoc
   */
  execute() {
    this.state = State.EXECUTING;
    var am = getAreaManager();
    var list = am.getAll();

    for (var i = 0, n = list.length; i < n; i++) {
      if (list[i].get('shown')) {
        this.ids_[list[i].getId()] = true;
        am.toggle(list[i], false);
      }
    }

    this.state = State.SUCCESS;
    return true;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;

    var am = getAreaManager();
    var list = am.getAll();

    for (var i = 0, n = list.length; i < n; i++) {
      if (list[i].getId() in this.ids_) {
        am.toggle(list[i], true);
      }
    }

    this.ids_ = {};
    this.state = State.READY;
    return true;
  }
}
