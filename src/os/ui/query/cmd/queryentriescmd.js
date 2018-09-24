goog.provide('os.ui.query.cmd.QueryEntries');

goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Command for adding query entries.
 * @param {!Array<!Object<string, string|boolean>>} entries
 * @param {boolean=} opt_merge
 * @param {string=} opt_layerHint
 * @param {boolean=} opt_immediate Whether to immediately force queryManager to update
 * @implements {os.command.ICommand}
 * @constructor
 */
os.ui.query.cmd.QueryEntries = function(entries, opt_merge, opt_layerHint, opt_immediate) {
  /**
   * @type {!Array<!Object<string, string|boolean>>}
   * @protected
   */
  this.newEntries = entries;

  /**
   * @type {boolean}
   * @protected
   */
  this.merge = goog.isDef(opt_merge) ? opt_merge : false;

  /**
   * @type {string|undefined}
   * @protected
   */
  this.layerHint = opt_layerHint;

  /**
   * @type {boolean}
   * @protected
   */
  this.immediate = goog.isDef(opt_immediate) ? opt_immediate : false;

  /**
   * @type {!Array<!Object<string, string|boolean>>}
   * @protected
   */
  this.oldEntries = this.getOldEntries();
};


/**
 * @inheritDoc
 */
os.ui.query.cmd.QueryEntries.prototype.isAsync = false;


/**
 * @inheritDoc
 */
os.ui.query.cmd.QueryEntries.prototype.title = 'Change query entries';


/**
 * @inheritDoc
 */
os.ui.query.cmd.QueryEntries.prototype.details = null;


/**
 * @inheritDoc
 */
os.ui.query.cmd.QueryEntries.prototype.state = os.command.State.READY;


/**
 * Checks if the command is ready to execute
 * @return {boolean}
 */
os.ui.query.cmd.QueryEntries.prototype.canExecute = function() {
  if (this.state !== os.command.State.READY) {
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
};


/**
 * @inheritDoc
 */
os.ui.query.cmd.QueryEntries.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;
    this.swap(this.newEntries);
    this.state = os.command.State.SUCCESS;
    return true;
  }

  return false;
};


/**
 * @inheritDoc
 */
os.ui.query.cmd.QueryEntries.prototype.revert = function() {
  this.state = os.command.State.REVERTING;
  this.swap(this.oldEntries);
  this.state = os.command.State.READY;
  return true;
};


/**
 * @param {!Array<!Object<string, string|boolean>>} entries
 * @protected
 */
os.ui.query.cmd.QueryEntries.prototype.swap = function(entries) {
  var qm = os.ui.queryManager;

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
};


/**
 * @return {!Array<!Object<string, string|boolean>>}
 * @protected
 */
os.ui.query.cmd.QueryEntries.prototype.getOldEntries = function() {
  var fullSet = os.ui.queryManager.getEntries();
  var layerSet = this.getLayerSet();

  return this.merge ? fullSet.filter(function(entry) {
    var id = /** @type {string} */ (entry['layerId']);
    return id in layerSet;
  }) : fullSet;
};


/**
 * @return {Object<string, boolean>} layer set
 * @protected
 */
os.ui.query.cmd.QueryEntries.prototype.getLayerSet = function() {
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
};


