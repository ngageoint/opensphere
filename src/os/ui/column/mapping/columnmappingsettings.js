goog.module('os.ui.column.mapping.ColumnMappingSettings');
goog.module.declareLegacyNamespace();

const {TYPE} = goog.require('os.file.mime.columnmapping');
const ColumnMappingImportUI = goog.require('os.ui.column.mapping.ColumnMappingImportUI');
const {directiveTag: settingsUi} = goog.require('os.ui.column.mapping.ColumnMappingSettingsUI');
const SettingPlugin = goog.require('os.ui.config.SettingPlugin');
const ImportManager = goog.require('os.ui.im.ImportManager');


/**
 * Column mapping settings plugin.
 */
class ColumnMappingSettings extends SettingPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    ImportManager.getInstance().registerImportUI(TYPE, new ColumnMappingImportUI());

    this.setLabel('Column Associations');
    this.setDescription('Configure your column associations');
    this.setTags(['column', 'mapping', 'data']);
    this.setIcon('fa fa-columns');
    this.setUI(settingsUi);
  }

  /**
   * @inheritDoc
   */
  getId() {
    return ColumnMappingSettings.ID;
  }
}

/**
 * @type {string}
 * @const
 */
ColumnMappingSettings.ID = 'columnMappingSettings';

exports = ColumnMappingSettings;
