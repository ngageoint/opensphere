goog.provide('os.ui.column.mapping.ColumnMappingImportUI');
goog.require('goog.dom.xml');
goog.require('goog.log');
goog.require('os.column.ColumnMapping');
goog.require('os.column.ColumnMappingManager');
goog.require('os.ui.im.FileImportUI');
goog.require('os.ui.window');



/**
 * @extends {os.ui.im.FileImportUI}
 * @constructor
 */
os.ui.column.mapping.ColumnMappingImportUI = function() {
  os.ui.column.mapping.ColumnMappingImportUI.base(this, 'constructor');

  // file contents are only used in memory, not loaded from storage
  this.requiresStorage = false;

  /**
   * @protected
   * @type {goog.log.Logger}
   */
  this.log = os.ui.column.mapping.ColumnMappingImportUI.LOGGER_;
};
goog.inherits(os.ui.column.mapping.ColumnMappingImportUI, os.ui.im.FileImportUI);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 */
os.ui.column.mapping.ColumnMappingImportUI.LOGGER_ = goog.log.getLogger('os.ui.column.mapping.ColumnMappingImportUI');


/**
 * @inheritDoc
 */
os.ui.column.mapping.ColumnMappingImportUI.prototype.launchUI = function(file, opt_config) {
  os.ui.column.mapping.ColumnMappingImportUI.base(this, 'launchUI', file, opt_config);

  var options = {
    'x': 'center',
    'y': 'center',
    'label': 'Import Column Associations',
    'show-close': false,
    'no-scroll': true,
    'width': 400,
    'height': 200,
    'icon': 'fa fa-sign-in color-import'
  };

  var scopeOptions = {
    'confirmCallback': this.confirm_.bind(this, file),
    'yesText': 'Clear and Import',
    'yesIcon': 'btn-icon fa fa-check color-add',
    'noText': 'Cancel',
    'noIcon': 'btn-icon fa fa-ban red-icon'
  };

  var cmm = os.column.ColumnMappingManager.getInstance();
  var all = cmm.getAll();
  if (all && all.length > 0) {
    var text = 'You are importing a new set of Column Associations. This action will <b>wipe out all existing ' +
        'Column Associations and replace them with the imported set</b><br><br>Are you sure you want to proceed?';
    var template = '<confirm>' + text + '</confirm>';
    os.ui.window.create(options, template, undefined, undefined, undefined, scopeOptions);
  } else {
    this.confirm_(file);
  }
};


/**
 * Confirmation callback for proceeding to import the column mappings.
 * @param {os.file.File} file
 * @private
 */
os.ui.column.mapping.ColumnMappingImportUI.prototype.confirm_ = function(file) {
  var mappings = [];
  var content = file.getContent();

  if (content && typeof content === 'string') {
    try {
      var doc = goog.dom.xml.loadXml(content);
      var root = goog.dom.getFirstElementChild(doc);
      var mappingEles = root.querySelectorAll(os.column.ColumnMappingTag.COLUMN_MAPPING);

      for (var i = 0, ii = mappingEles.length; i < ii; i++) {
        var ele = mappingEles[i];
        var eleString = goog.dom.xml.serialize(ele);
        var mapping = new os.column.ColumnMapping();
        mapping.restore({'columnMapping': eleString});
        mappings.push(mapping);
      }
    } catch (e) {
      goog.log.error(this.log, 'Failed to parse Column Associations! Stack: ' + e.stack);
      var msg = 'There was a problem importing the Column Associations. Please see the log for more details.';
      os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
    }
  } else {
    goog.log.warning(this.log, 'No content was passed to the import process.');
    var msg = 'We didn\'t find any data to import in that file! No changes were made to your Column Associations.';
    os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.WARNING);
  }

  if (mappings.length > 0) {
    // we have new mappings, so clear the manager and insert them
    var cmm = os.column.ColumnMappingManager.getInstance();
    cmm.clear();
    cmm.bulkAdd(mappings);

    var plural = mappings.length === 1 ? 'Association.' : 'Associations.';
    var msg = 'Successfully imported <b>' + mappings.length + '</b> Column ' + plural;
    os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.SUCCESS);
  }
};
