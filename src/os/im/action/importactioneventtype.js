goog.declareModuleId('os.im.action.ImportActionEventType');

/**
 * @enum {string}
 */
const ImportActionEventType = {
  ADD_ENTRY: 'importAction:addEntry',
  COPY_ENTRY: 'importAction:copyEntry',
  EDIT_ENTRY: 'importAction:editEntry',
  REMOVE_ENTRY: 'importAction:removeEntry',
  REFRESH: 'importAction:refresh'
};

export default ImportActionEventType;
