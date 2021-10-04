goog.declareModuleId('os.command.VectorLayerShape');

import DataManager from '../data/datamanager.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import {SUB_DELIMITER} from '../metrics/index.js';
import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import PropertyChange from '../source/propertychange.js';
import * as osStyle from '../style/style.js';
import * as kml from '../ui/file/kml/kml.js';
import AbstractVectorStyle from './abstractvectorstylecmd.js';


/**
 * Changes the style of a layer
 *
 * @extends {AbstractVectorStyle<string>}
 */
export default class VectorLayerShape extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} style
   * @param {string=} opt_oldStyle
   */
  constructor(layerId, style, opt_oldStyle) {
    super(layerId, style, opt_oldStyle);
    this.title = 'Change Style';

    var type = style ? style.replace(/ /g, '_') : 'Unknown';
    this.metricKey = LayerKeys.VECTOR_SHAPE + SUB_DELIMITER + type;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var oldVal;
    var source = DataManager.getInstance().getSource(this.layerId);
    if (source) {
      oldVal = source.getGeometryShape();
    }

    return oldVal || osStyle.DEFAULT_SHAPE;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    // if the new shape value isn't defined, config will be set to the default value
    var source = DataManager.getInstance().getSource(this.layerId);
    if (source && value) {
      source.setGeometryShape(value);

      // if using the icon shape, make sure the config has an icon defined
      if (value == osStyle.ShapeType.ICON && !osStyle.getConfigIcon(config)) {
        osStyle.setConfigIcon(config, kml.getDefaultIcon());
      }
    }

    super.applyValue(config, value);
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    var source = DataManager.getInstance().getSource(this.layerId);
    source.dispatchEvent(new PropertyChangeEvent(PropertyChange.GEOMETRY_SHAPE, this.value,
        this.oldValue));

    super.finish(config);
  }
}
