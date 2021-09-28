goog.declareModuleId('os.column.ColumnMappingEventType');

/**
 * @enum {string}
 */
const ColumnMappingEventType = {
  MAPPINGS_CHANGE: 'mappingsChange',
  COLUMN_ADDED: 'columnAdded',
  COLUMN_REMOVED: 'columnRemoved'
};

export default ColumnMappingEventType;
