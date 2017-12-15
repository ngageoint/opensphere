goog.provide('os.column.ColumnMappingTypeMethod');
goog.require('os.file.type.AbstractXMLTypeMethod');



/**
 * @extends {os.file.type.AbstractXMLTypeMethod}
 * @constructor
 */
os.column.ColumnMappingTypeMethod = function() {
  os.column.ColumnMappingTypeMethod.base(this, 'constructor');
};
goog.inherits(os.column.ColumnMappingTypeMethod, os.file.type.AbstractXMLTypeMethod);


/**
 * The content type use to describe column mappings.
 * @type {string}
 */
os.column.ColumnMappingTypeMethod.CONTENT_TYPE = 'text/xml; subtype=COLUMNMAPPING';


/**
 * @inheritDoc
 */
os.column.ColumnMappingTypeMethod.prototype.getContentType = function() {
  return os.column.ColumnMappingTypeMethod.CONTENT_TYPE;
};


/**
 * @inheritDoc
 */
os.column.ColumnMappingTypeMethod.prototype.getLayerType = function() {
  return 'columnmapping';
};


/**
 * @inheritDoc
 */
os.column.ColumnMappingTypeMethod.prototype.getNSRegExp = function() {
  return /\/columnMappings/i;
};


/**
 * @inheritDoc
 */
os.column.ColumnMappingTypeMethod.prototype.getRootRegExp = function() {
  return /^columnmappings$/i;
};
