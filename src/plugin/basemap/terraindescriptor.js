goog.declareModuleId('plugin.basemap.TerrainDescriptor');

const DisplaySetting = goog.require('os.config.DisplaySetting');
const Settings = goog.require('os.config.Settings');
const BaseDescriptor = goog.require('os.data.BaseDescriptor');
const Icons = goog.require('os.ui.Icons');
const basemap = goog.require('plugin.basemap');


/**
 * Descriptor to activate/deactivate terrain from the Add Data window.
 */
export default class TerrainDescriptor extends BaseDescriptor {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.setDescription(TerrainDescriptor.DESCRIPTION);
    this.setProvider(null);
    this.setTags(['GEOINT', 'Terrain', 'Elevation']);
    this.setTitle('Terrain');
    this.setType(null);
    this.descriptorType = basemap.TERRAIN_ID;

    Settings.getInstance().listen(DisplaySetting.ENABLE_TERRAIN, this.onTerrainChange_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    Settings.getInstance().unlisten(DisplaySetting.ENABLE_TERRAIN, this.onTerrainChange_, false, this);
  }

  /**
   * @inheritDoc
   */
  getIcons() {
    return Icons.TERRAIN;
  }

  /**
   * @inheritDoc
   */
  setActiveInternal() {
    Settings.getInstance().set(DisplaySetting.ENABLE_TERRAIN, this.isActive());

    return super.setActiveInternal();
  }

  /**
   * @inheritDoc
   */
  restore(from) {
    super.restore(from);
    this.tempActive = /** @type {boolean} */ (Settings.getInstance().get(DisplaySetting.ENABLE_TERRAIN, false));
    this.updateActiveFromTemp();
  }

  /**
   * Handle changes to the terrain enabled setting.
   *
   * @param {os.events.SettingChangeEvent} event
   * @private
   */
  onTerrainChange_(event) {
    if (event.newVal !== this.isActive()) {
      this.setActive(/** @type {boolean} */ (event.newVal));
    }
  }
}


/**
 * User-facing description.
 * @type {string}
 * @const
 */
TerrainDescriptor.DESCRIPTION = 'Show terrain on the 3D globe.';
