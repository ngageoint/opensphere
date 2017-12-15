goog.provide('os.im.action');
goog.provide('os.im.action.TagName');


/**
 * Identifier for import action components.
 * @type {string}
 * @const
 */
os.im.action.ID = 'importAction';


/**
 * Icon to represent import actions.
 * @type {string}
 * @const
 */
os.im.action.ICON = 'fa-magic';


/**
 * Timeline metrics tracked by MIST.
 * @enum {string}
 */
os.im.action.Metrics = {
  COPY: 'importAction.copy',
  CREATE: 'importAction.create',
  EDIT: 'importAction.edit',
  EXPORT: 'importAction.export',
  IMPORT: 'importAction.import',
  REMOVE: 'importAction.remove'
};


/**
 * XML tags used by import actions.
 * @enum {string}
 */
os.im.action.TagName = {
  ACTIONS: 'actions',
  IMPORT_ACTIONS: 'importActions',
  IMPORT_ACTION: 'importAction'
};


/**
 * Sort import actions by label.
 * @param {os.im.action.IImportAction} a First action.
 * @param {os.im.action.IImportAction} b Second action.
 * @return {number} Sort order of the actions, by label.
 */
os.im.action.sortByLabel = function(a, b) {
  var aLabel = a ? a.getLabel() : '';
  var bLabel = b ? b.getLabel() : '';
  return goog.array.defaultCompare(aLabel, bLabel);
};
