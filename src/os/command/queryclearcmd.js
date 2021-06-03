goog.module('os.command.QueryClear');
goog.module.declareLegacyNamespace();

const State = goog.require('os.command.State');

const ICommand = goog.requireType('os.command.ICommand');


/**
 * Command for clearing spatial queries on the map.
 *
 * @implements {ICommand}
 */
class QueryClear {
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
    var am = os.query.AreaManager.getInstance();
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

    var am = os.query.AreaManager.getInstance();
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

exports = QueryClear;
