goog.declareModuleId('plugin.overview.OverviewPlugin');

import TileLayer from 'ol/src/layer/Tile.js';

import Settings from '../../os/config/settings.js';
import MapContainer from '../../os/mapcontainer.js';
import AbstractPlugin from '../../os/plugin/abstractplugin.js';
import OverviewMap from './overviewmapcontrol.js';

/**
 * Adds an overview map to the map controls that syncs with the current base maps
 */
export default class OverviewPlugin extends AbstractPlugin {
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

    this.previousGroupCount = 0;
  }

  /**
   * @inheritDoc
   */
  init() {
    // just grab the base map group
    const layerGroup = MapContainer.getInstance().getMap().getLayers().getArray()[0];
    this.previousGroupCount = layerGroup.getLayers().getLength();
    layerGroup.on('change', this.layersChanged.bind(this));
  }

  /**
   * Handles when layers change on map, and changes them on the overview map.
   */
  layersChanged() {
    const layerGroup = MapContainer.getInstance().getMap().getLayers().getArray()[0];
    let hasChanged = false;
    const currentLayerCount = layerGroup.getLayers().getLength();
    hasChanged = this.previousGroupCount != currentLayerCount;
    if (!hasChanged) {
      const currentLayers = layerGroup.getLayers().getArray();
      const overviewLayers = this.control.getOverviewMap().getLayers().getArray();
      for (let i = 0; i < currentLayerCount && !hasChanged; i++) {
        hasChanged = currentLayers[i].getSource() != overviewLayers[i].getSource() ||
          currentLayers[i].getMaxResolution() != overviewLayers[i].getMaxResolution() ||
          currentLayers[i].getMinResolution() != overviewLayers[i].getMinResolution() ||
          currentLayers[i].getOpacity() != overviewLayers[i].getOpacity();
      }
    }

    if (hasChanged) {
      // add the overview map control
      var collapsed = /** @type {boolean} */ (Settings.getInstance().get(OverviewMap.SHOW_KEY, false));
      const layers = [];
      const currentLayers = layerGroup.getLayers().getArray();
      for (let i = 0; i < currentLayerCount; i++) {
        const source = currentLayers[i].getSource();
        const maxRes = currentLayers[i].getMaxResolution();
        const minRes = currentLayers[i].getMinResolution();
        layers.push(new TileLayer({
          source: source,
          opacity: currentLayers[i].getOpacity(),
          preload: Infinity,
          maxResolution: maxRes,
          minResolution: minRes
        }));
      }

      if (this.control == null) {
        this.control = new OverviewMap({
          collapsed: collapsed,
          label: '\u00AB',
          collapseLabel: '\u00BB',
          layers: layers});

        MapContainer.getInstance().getMap().getControls().push(this.control);
      } else {
        this.control.getOverviewMap().setLayers(layers);
      }

      this.previousGroupCount = currentLayerCount;
    }
  }
}
