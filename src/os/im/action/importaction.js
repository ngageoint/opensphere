goog.module('os.im.action');
goog.module.declareLegacyNamespace();

const osSource = goog.require('os.source');

const IFilterable = goog.requireType('os.filter.IFilterable');
const FilterActionEntry = goog.requireType('os.im.action.FilterActionEntry');
const ImportActionManager = goog.requireType('os.im.action.ImportActionManager');
const IImportAction = goog.requireType('os.im.action.IImportAction');
const FeatureTypeColumn = goog.requireType('os.ogc.FeatureTypeColumn');
const ISource = goog.requireType('os.source.ISource');


/**
 * Identifier for import action components.
 * @type {string}
 */
const ID = 'importAction';

/**
 * Icon to represent import actions.
 * @type {string}
 */
const ICON = 'fa-magic';

/**
 * Timeline metrics tracked by OpenSphere.
 * @enum {string}
 */
const Metrics = {
  COPY: 'importAction.copy',
  CREATE: 'importAction.create',
  EDIT: 'importAction.edit',
  EXPORT: 'importAction.export',
  IMPORT: 'importAction.import',
  REMOVE: 'importAction.remove'
};

/**
 * The global ImportActionManager instance. This is used to deconflict circular dependencies.
 */
let importActionManager = null;

/**
 * Set the global ImportActionManager instance.
 * @return {ImportActionManager}
 */
const getImportActionManager = () => importActionManager;

/**
 * Set the global ImportActionManager instance.
 * @param {!ImportActionManager} value The instance.
 */
const setImportActionManager = (value) => {
  importActionManager = value;
};

/**
 * Set enabled state of a filter action entries and its children from a map.
 * @param {FilterActionEntry} entry The entry.
 * @param {Object<string, boolean>} enabled Map of entry id to enabled state. Defaults to false for undefined id's.
 */
const enableFromMap = function(entry, enabled) {
  entry.setEnabled(!!enabled[entry.getId()]);

  var children = entry.getChildren();
  if (children) {
    children.forEach(function(child) {
      enableFromMap(child, enabled);
    });
  }
};

/**
 * Get columns from a filterable.
 *
 * @param {IFilterable} filterable
 * @return {Array<FeatureTypeColumn>} columns of the  filterable
 */
const getColumnsFromFilterable = function(filterable) {
  var columns = null;

  if (filterable instanceof os.layer.Vector) {
    var source = /** @type {ISource} */ (filterable.getSource());
    columns = osSource.getFilterColumns(source, true, true);
    columns = columns.map(osSource.definitionsToFeatureTypes);
  } else {
    columns = filterable.getFilterColumns();
  }

  return columns;
};

/**
 * Get the enabled state of the entry and its children.
 * @param {FilterActionEntry} entry The entry.
 * @param {Object<string, boolean>=} opt_result Object to store the result.
 * @return {!Object<string, boolean>} Map of entry id's to the enabled state.
 */
const getEnabledMap = function(entry, opt_result) {
  var result = opt_result || {};
  if (entry) {
    if (entry.isEnabled()) {
      result[entry.getId()] = true;
    }

    var children = entry.getChildren();
    if (children) {
      for (var i = 0; i < children.length; i++) {
        getEnabledMap(children[i], result);
      }
    }
  }

  return result;
};

/**
 * Set enabled state of a filter action entries and its children from a map.
 * @param {!Array<string>} ids Array of enabled entry id's.
 * @param {FilterActionEntry} entry The entry.
 * @return {!Array<string>} Array of enabled entry id's.
 */
const reduceEnabled = function(ids, entry) {
  if (entry) {
    if (entry.isEnabled()) {
      ids.push(entry.getId());
    }

    var children = entry.getChildren();
    if (children) {
      children.reduce(reduceEnabled, ids);
    }
  }

  return ids;
};

/**
 * Sort import actions by label.
 *
 * @param {IImportAction} a First action.
 * @param {IImportAction} b Second action.
 * @return {number} Sort order of the actions, by label.
 */
const sortByLabel = function(a, b) {
  var aLabel = a ? a.getLabel() : '';
  var bLabel = b ? b.getLabel() : '';
  return goog.array.defaultCompare(aLabel, bLabel);
};

/**
 * Static function to test for enabled filter action entries.
 *
 * @param {FilterActionEntry} entry The entry.
 * @return {boolean} If the entry is enabled.
 */
const testFilterActionEnabled = function(entry) {
  return entry.isEnabled();
};

exports = {
  ID,
  ICON,
  Metrics,
  getImportActionManager,
  setImportActionManager,
  enableFromMap,
  getColumnsFromFilterable,
  getEnabledMap,
  reduceEnabled,
  sortByLabel,
  testFilterActionEnabled
};
