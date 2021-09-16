goog.module('os.ui.query.cmd.QueryEntries');

const State = goog.require('os.command.State');
const {getQueryManager} = goog.require('os.query.instance');

const ICommand = goog.requireType('os.command.ICommand');


/**
 * Command for adding query entries.
 *
 * @implements {ICommand}
 */
class QueryEntries {
  /**
   * Constructor.
   * @param {!Array<!Object<string, string|boolean>>} entries
   * @param {boolean=} opt_merge
   * @param {string=} opt_layerHint
   * @param {boolean=} opt_immediate Whether to immediately force queryManager to update
   */
  constructor(entries, opt_merge, opt_layerHint, opt_immediate) {
    /**
     * @inheritDoc
     */
    this.isAsync = false;

    /**
     * @inheritDoc
     */
    this.title = 'Change query entries';

    /**
     * @inheritDoc
     */
    this.details = null;

    /**
     * @inheritDoc
     */
    this.state = State.READY;

    /**
     * @type {!Array<!Object<string, string|boolean>>}
     * @protected
     */
    this.newEntries = entries;

    /**
     * @type {boolean}
     * @protected
     */
    this.merge = opt_merge !== undefined ? opt_merge : false;

    /**
     * @type {string|undefined}
     * @protected
     */
    this.layerHint = opt_layerHint;

    /**
     * @type {boolean}
     * @protected
     */
    this.immediate = opt_immediate !== undefined ? opt_immediate : false;

    /**
     * @type {!Array<!Object<string, string|boolean>>}
     * @protected
     */
    this.oldEntries = this.getOldEntries();
  }

  /**
   * Checks if the command is ready to execute
   *
   * @return {boolean}
   */
  canExecute() {
    if (this.state !== State.READY) {
      this.details = 'Command not in ready state.';
      return false;
    }

    if (!this.newEntries) {
      this.details = 'No new entries provided.';
      return false;
    }

    if (!this.oldEntries) {
      this.details = 'No old entries found.';
      return false;
    }

    if (this.merge && this.newEntries.length === 0 && !this.layerHint) {
      this.details = 'When merging an empty set, the layer hint must be supplied';
      return false;
    }

    return true;
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;
      this.swap(this.newEntries);
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
    this.swap(this.oldEntries);
    this.state = State.READY;
    return true;
  }

  /**
   * @param {!Array<!Object<string, string|boolean>>} entries
   * @protected
   */
  swap(entries) {
    var qm = getQueryManager();

    if (this.merge) {
      var layerSet = this.getLayerSet();
      // remove all items related to those layers
      for (var id in layerSet) {
        qm.removeEntries(id, undefined, undefined, true);
      }
    } else {
      qm.removeEntries(undefined, undefined, undefined, true);
    }

    qm.addEntries(entries, this.immediate, this.layerHint);
  }

  /**
   * @return {!Array<!Object<string, string|boolean>>}
   * @protected
   */
  getOldEntries() {
    var fullSet = getQueryManager().getEntries();
    var layerSet = this.getLayerSet();

    return this.merge ? fullSet.filter(function(entry) {
      var id = /** @type {string} */ (entry['layerId']);
      return id in layerSet;
    }) : fullSet;
  }

  /**
   * @return {Object<string, boolean>} layer set
   * @protected
   */
  getLayerSet() {
    var layerSet = {};

    if (this.layerHint) {
      layerSet[this.layerHint] = true;
    }

    layerSet = this.newEntries.reduce(function(layerSet, entry) {
      var id = /** @type {string} */ (entry['layerId']);
      layerSet[id] = true;
      return layerSet;
    }, layerSet);

    return layerSet;
  }
}

exports = QueryEntries;
