goog.declareModuleId('plugin.electron.SettingsFileNode');

import PropertyChangeEvent from '../../os/events/propertychangeevent.js';
import TriState from '../../os/structs/tristate.js';
import SlickTreeNode from '../../os/ui/slick/slicktreenode.js';
import {directiveTag as nodeUi} from './settingsfilenodeui.js';


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
   * @param {!ElectronOS.SettingsFile} file The settings file.
   */
  constructor(file) {
    super();

    // Prevent drag/drop on the node.
    this.childrenAllowed = false;

    /**
     * The file.
     * @type {!ElectronOS.SettingsFile}
     */
    this.file = file;

    this.setLabel(file.label);
    this.setNodeUI(`<${nodeUi}></${nodeUi}>`);
    this.setState(file.enabled ? TriState.ON : TriState.OFF);
  }

  /**
   * Get the file path to save to settings.
   * @return {!ElectronOS.SettingsFile}
   */
  getFile() {
    return this.file;
  }

  /**
   * If this is the default settings file.
   * @return {boolean}
   */
  isDefault() {
    return !!this.file && this.file.default;
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
    if (!this.file.enabled) {
      // if the file is disabled, adjust the style to indicate the change
      labelClass += ' text-muted';
    }

    return `<span class="${labelClass}">${this.formatValue(value)}</span>`;
  }

  /**
   * @inheritDoc
   */
  setState(value) {
    if (this.file) {
      this.file.enabled = value === TriState.ON;
    }

    super.setState(value);

    this.dispatchEvent(new PropertyChangeEvent('label'));
  }
}
