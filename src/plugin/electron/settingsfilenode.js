goog.declareModuleId('plugin.electron.SettingsFileNode');

const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const TriState = goog.require('os.structs.TriState');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');

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
