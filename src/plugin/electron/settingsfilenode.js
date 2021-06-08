goog.declareModuleId('plugin.electron.SettingsFileNode');

import {directiveTag as nodeUi} from './settingsfilenodeui';

const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const TriState = goog.require('os.structs.TriState');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');


/**
 * Icon to display on the default settings file.
 * @type {string}
 */
const defaultIcon = '<i class="fas fa-shield-alt" title="This is the default application settings file. It can be ' +
    'disabled, but cannot be removed."></i>';


/**
 * Tree node for a settings file.
 */
export default class SettingsFileNode extends SlickTreeNode {
  /**
   * Constructor.
   * @param {string} file The settings file.
   */
  constructor(file) {
    super();

    /**
     * The file.
     * @type {string}
     */
    this.file = file.replace(/^!/, '');

    this.setNodeUI(`<${nodeUi}></${nodeUi}>`);
    this.setState(file.startsWith('!') ? TriState.OFF : TriState.ON);

    // Strip the user settings directory from the node label.
    const userSettingsDir = ElectronOS.getUserSettingsDir();
    this.setLabel(this.file.replace(userSettingsDir, '').replace(/^[\/]+/, ''));
  }

  /**
   * Get the file path to save to settings.
   * @return {string}
   */
  getFilePath() {
    return this.getState() === TriState.ON ? this.file : `!${this.file}`;
  }

  /**
   * If this is the default settings file.
   * @return {boolean}
   */
  isDefault() {
    return this.getLabel() === 'settings-default.json';
  }

  /**
   * @inheritDoc
   */
  formatIcons() {
    let icons = super.formatIcons();

    if (this.isDefault()) {
      icons += defaultIcon;
    }

    return icons;
  }

  /**
   * @inheritDoc
   */
  formatLabel(value) {
    let labelClass = 'text-truncate flex-fill';
    if (this.getState() !== TriState.ON) {
      // if the file is disabled, adjust the style to indicate the change
      labelClass += ' text-muted';
    }

    return `<span class="${labelClass}">${this.formatValue(value)}</span>`;
  }

  /**
   * @inheritDoc
   */
  setState(value) {
    super.setState(value);
    this.dispatchEvent(new PropertyChangeEvent('label'));
  }
}
