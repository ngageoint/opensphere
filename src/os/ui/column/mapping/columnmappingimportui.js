goog.declareModuleId('os.ui.column.mapping.ColumnMappingImportUI');

import AlertEventSeverity from '../../../alert/alerteventseverity.js';
import AlertManager from '../../../alert/alertmanager.js';
import ColumnMapping from '../../../column/columnmapping.js';
import ColumnMappingManager from '../../../column/columnmappingmanager.js';
import ColumnMappingTag from '../../../column/columnmappingtag.js';
import FileImportUI from '../../im/fileimportui.js';
import * as ConfirmUI from '../../window/confirm.js';

const {getFirstElementChild} = goog.require('goog.dom');
const {loadXml, serialize} = goog.require('goog.dom.xml');
const log = goog.require('goog.log');

const {default: OSFile} = goog.requireType('os.file.File');


/**
 */
export default class ColumnMappingImportUI extends FileImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();

    // file contents are only used in memory, not loaded from storage
    this.requiresStorage = false;

    /**
     * @protected
     * @type {log.Logger}
     */
    this.log = logger;
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    var cmm = ColumnMappingManager.getInstance();
    var all = cmm.getAll();
    if (all && all.length > 0) {
      var text = 'You are importing a new set of Column Associations. This action will <b>wipe out all existing ' +
          'Column Associations and replace them with the imported set</b><br><br>Are you sure you want to proceed?';

      ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
        confirm: this.confirm_.bind(this, file),
        prompt: text,
        yesText: 'Clear and Import',
        windowOptions: {
          'x': 'center',
          'y': 'center',
          'label': 'Import Column Associations',
          'show-close': false,
          'width': 400,
          'height': 'auto',
          'icon': 'fa fa-sign-in'
        }
      }));
    } else {
      this.confirm_(file);
    }
  }

  /**
   * Confirmation callback for proceeding to import the column mappings.
   *
   * @param {OSFile} file
   * @private
   */
  confirm_(file) {
    var mappings = [];
    var content = file.getContent();

    if (content && typeof content === 'string') {
      try {
        var doc = loadXml(content);
        var root = getFirstElementChild(doc);
        var mappingEles = root.querySelectorAll(ColumnMappingTag.COLUMN_MAPPING);

        for (var i = 0, ii = mappingEles.length; i < ii; i++) {
          var ele = mappingEles[i];
          var eleString = serialize(ele);
          var mapping = new ColumnMapping();
          mapping.restore({'columnMapping': eleString});
          mappings.push(mapping);
        }
      } catch (e) {
        log.error(this.log, 'Failed to parse Column Associations! Stack: ' + e.stack);
        var msg = 'There was a problem importing the Column Associations. Please see the log for more details.';
        AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);
      }
    } else {
      log.warning(this.log, 'No content was passed to the import process.');
      var msg = 'We didn\'t find any data to import in that file! No changes were made to your Column Associations.';
      AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.WARNING);
    }

    if (mappings.length > 0) {
      // we have new mappings, so clear the manager and insert them
      var cmm = ColumnMappingManager.getInstance();
      cmm.clear();
      cmm.bulkAdd(mappings);

      var plural = mappings.length === 1 ? 'Association.' : 'Associations.';
      var msg = 'Successfully imported <b>' + mappings.length + '</b> Column ' + plural;
      AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.SUCCESS);
    }
  }
}

/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('os.ui.column.mapping.ColumnMappingImportUI');
