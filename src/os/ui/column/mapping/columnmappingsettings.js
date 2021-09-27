goog.declareModuleId('os.ui.column.mapping.ColumnMappingSettings');

import SettingPlugin from '../../config/settingplugin.js';
import ImportManager from '../../im/importmanager.js';
import ColumnMappingImportUI from './columnmappingimportui.js';
import {directiveTag as settingsUi} from './columnmappingsettingsui.js';

const {TYPE} = goog.require('os.file.mime.columnmapping');


/**
 * Column mapping settings plugin.
 */
export default class ColumnMappingSettings extends SettingPlugin {
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
