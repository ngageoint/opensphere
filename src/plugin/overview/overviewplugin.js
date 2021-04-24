goog.module('plugin.overview.OverviewPlugin');
goog.module.declareLegacyNamespace();

const MapContainer = goog.require('os.MapContainer');
const Settings = goog.require('os.config.Settings');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const OverviewMap = goog.require('plugin.overview.OverviewMap');


/**
 * Adds an overview map to the map controls that syncs with the current base maps
 */
class OverviewPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = 'overview';

    /**
     * @type {?OverviewMap}
     * @protected
     */
    this.control = null;
  }

  /**
   * @inheritDoc
   */
  init() {
    // add the overview map control
    var collapsed = /** @type {boolean} */ (Settings.getInstance().get(OverviewMap.SHOW_KEY, false));

    this.control = new OverviewMap({
      collapsed: collapsed,
      label: '\u00AB',
      collapseLabel: '\u00BB',
      layers: [
        // just grab the base map group
        MapContainer.getInstance().getMap().getLayers().getArray()[0]
      ]});

    MapContainer.getInstance().getMap().getControls().push(this.control);
  }
}

exports = OverviewPlugin;
