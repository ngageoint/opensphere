goog.provide('os.ui.query.cmd.AreaAdd');
goog.require('os.command.ICommand');
goog.require('os.ol.feature');
goog.require('os.ui.query.cmd.AbstractArea');



/**
 * Command for adding an area
 * @param {!ol.Feature} area
 * @param {boolean=} opt_include
 * @param {boolean=} opt_exclude
 * @param {boolean=} opt_append
 * @param {Array<string>=} opt_layerIds - layers to apply this area to
 * @implements {os.command.ICommand}
 * @extends {os.ui.query.cmd.AbstractArea}
 * @constructor
 */
os.ui.query.cmd.AreaAdd = function(area, opt_include, opt_exclude, opt_append, opt_layerIds) {
  // clone the feature to avoid potential conflicts if the feature came from another source. only copy the properties
  // that are used by the area manager.
  if (!os.ui.areaManager.get(area)) {
    area = os.ol.feature.clone(area, os.ui.query.featureKeys);
  }

  os.ui.query.cmd.AreaAdd.base(this, 'constructor', area);

  // Override the entries array to include negations. These must be removed, see THIN-7751.
  this.entries = area.getId() ?
      os.ui.queryManager.getEntries(null, /** @type {string} */ (area.getId()), null, null, true) : [];

  this.include = goog.isDef(opt_include) ? opt_include : this.include;
  this.exclude = goog.isDef(opt_exclude) ? opt_exclude : this.exclude;
  this.append = goog.isDef(opt_append) ? opt_append : this.append;
  this.title = 'Add ' + (this.include ? 'query ' : this.exclude ? 'exclusion ' : '') + 'area';

  if (area) {
    var areaTitle = area.get('title');
    if (areaTitle) {
      this.title += ' "' + areaTitle + '"';
    }
  }

  /**
   * layers to apply this area to
   * @type {Array<string>}
   */
  this.layerIds = goog.isDef(opt_layerIds) ? opt_layerIds : ['*'];

  /**
   * @type {boolean}
   * @private
   */
  this.added_ = false;
};
goog.inherits(os.ui.query.cmd.AreaAdd, os.ui.query.cmd.AbstractArea);


/**
 * @inheritDoc
 */
os.ui.query.cmd.AreaAdd.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;

    var am = os.ui.areaManager;
    var qm = os.ui.queryManager;

    if (this.entries) {
      qm.removeEntriesArr(this.entries);
    }

    // Add the area if it doesnt exist
    if (!am.get(this.area)) {
      this.added_ = am.add(this.area);
    }

    if (this.include || this.exclude) {
      goog.array.forEach(this.layerIds, function(id) {
        qm.addEntry(id, /** @type {string} */ (this.area.getId()), '*', this.include);
      }, this);
    }

    this.state = os.command.State.SUCCESS;
    return true;
  }

  return false;
};


/**
 * @inheritDoc
 */
os.ui.query.cmd.AreaAdd.prototype.revert = function() {
  this.state = os.command.State.REVERTING;
  var am = os.ui.areaManager;
  var qm = os.ui.queryManager;

  if (this.include || this.exclude) {
    qm.removeEntries(undefined, /** @type {string} */ (this.area.getId()));
  }

  if (this.entries && this.entries.length) {
    qm.addEntries(this.entries);
  }

  if (this.added_) {
    am.remove(this.area);
  }

  this.state = os.command.State.READY;
  return true;
};

