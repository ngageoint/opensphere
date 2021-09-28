goog.declareModuleId('os.command.VectorLayerIcon');

import DataManager from '../data/datamanager.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import PropertyChange from '../source/propertychange.js';
import * as osStyle from '../style/style.js';
import StyleManager from '../style/stylemanager_shim.js';
import * as kml from '../ui/file/kml/kml.js';
import AbstractVectorStyle from './abstractvectorstylecmd.js';


/**
 * Configure a vector layer to display an icon.
 */
export default class VectorLayerIcon extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId The layer id.
   * @param {osx.icon.Icon} icon The new icon.
   * @param {osx.icon.Icon=} opt_oldIcon The old icon.
   */
  constructor(layerId, icon, opt_oldIcon) {
    super(layerId, icon, opt_oldIcon);
    this.title = 'Change Icon';
    this.metricKey = LayerKeys.VECTOR_ICON;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return osStyle.getConfigIcon(config) || kml.getDefaultIcon();
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    if (value) {
      osStyle.setConfigIcon(config, value);
    }

    super.applyValue(config, value);
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    var source = DataManager.getInstance().getSource(this.layerId);
    if (source) {
      source.dispatchEvent(new PropertyChangeEvent(PropertyChange.GEOMETRY_SHAPE));
    }

    super.finish(config);
  }
}
