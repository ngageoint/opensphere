goog.declareModuleId('os.ui.query.cmd.AreaAdd');

import {featureKeys} from '../query.js';
import AbstractArea from './abstractareacmd.js';

const State = goog.require('os.command.State');
const {clone} = goog.require('os.ol.feature');
const {getAreaManager, getQueryManager} = goog.require('os.query.instance');

const ICommand = goog.requireType('os.command.ICommand');


/**
 * Command for adding an area
 *
 * @implements {ICommand}
 */
export default class AreaAdd extends AbstractArea {
  /**
   * Constructor.
   * @param {!ol.Feature} area
   * @param {boolean=} opt_include
   * @param {boolean=} opt_exclude
   * @param {boolean=} opt_append
   * @param {Array<string>=} opt_layerIds - layers to apply this area to
   */
  constructor(area, opt_include, opt_exclude, opt_append, opt_layerIds) {
    // clone the feature to avoid potential conflicts if the feature came from another source. only copy the properties
    // that are used by the area manager.
    if (!getAreaManager().get(area)) {
      area = clone(area, featureKeys);
    }

    super(area);

    // Override the entries array to include negations. These must be removed, see THIN-7751.
    this.entries = area.getId() ?
      getQueryManager().getEntries(null, /** @type {string} */ (area.getId()), null, null, true) : [];

    this.include = opt_include !== undefined ? opt_include : this.include;
    this.exclude = opt_exclude !== undefined ? opt_exclude : this.exclude;
    this.append = opt_append !== undefined ? opt_append : this.append;
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
    this.layerIds = opt_layerIds !== undefined ? opt_layerIds : ['*'];

    /**
     * @type {boolean}
     * @private
     */
    this.added_ = false;
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

      // Add the area if it doesnt exist
      if (!am.get(this.area)) {
        this.added_ = am.add(this.area);
      }

      if (this.include || this.exclude) {
        this.layerIds.forEach(function(id) {
          qm.addEntry(id, /** @type {string} */ (this.area.getId()), '*', this.include);
        }, this);
      }

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

    if (this.include || this.exclude) {
      qm.removeEntries(undefined, /** @type {string} */ (this.area.getId()));
    }

    if (this.entries && this.entries.length) {
      qm.addEntries(this.entries);
    }

    if (this.added_) {
      am.remove(this.area);
    }

    this.state = State.READY;
    return true;
  }
}
