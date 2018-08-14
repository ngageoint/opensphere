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
   * @type {!Array<!Object<string, string|boolean>>}
   * @protected
   */
  this.oldEntries = os.ui.queryManager.getEntries();

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

    var qm = os.ui.queryManager;
    var merged = this.merge ? os.ui.query.cmd.QueryEntries.merge(this.newEntries, this.oldEntries, this.layerHint) :
        this.newEntries;

    qm.removeEntries(undefined, undefined, undefined, true);
    qm.addEntries(merged, this.immediate, this.layerHint);

    this.state = os.command.State.SUCCESS;
    return true;
  }

  return false;
};


/**
 * @param {!Array<!Object<string, string|boolean>>} newSet
 * @param {!Array<!Object<string, string|boolean>>} largeSet
 * @param {?string=} opt_layerHint
 * @return {!Array<!Object<string, string|boolean>>} merged set
 */
os.ui.query.cmd.QueryEntries.merge = function(newSet, largeSet, opt_layerHint) {
  var layerSet = {};

  if (opt_layerHint) {
    layerSet[opt_layerHint] = true;
  }

  // get all the layerIds from the new entries
  for (var i = 0, n = newSet.length; i < n; i++) {
    var id = /** @type {string} */ (newSet[i]['layerId']);
    layerSet[id] = true;
  }

  var merged = largeSet.slice();
  i = merged.length;
  while (i--) {
    id = /** @type {string} */ (merged[i]['layerId']);
    if (id in layerSet) {
      merged.splice(i, 1);
    }
  }

  if (newSet.length) {
    merged = merged.concat(newSet);
  }

  return merged;
};


/**
 * @inheritDoc
 */
os.ui.query.cmd.QueryEntries.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  var qm = os.ui.queryManager;
  qm.removeEntries(undefined, undefined, undefined, true);
  qm.addEntries(this.oldEntries, this.immediate, this.layerHint);

  this.state = os.command.State.READY;
  return true;
};

