goog.declareModuleId('os.interaction.DragZoom');

import {platformModifierKeyOnly} from 'ol/src/events/condition.js';

import FlyToExtent from '../command/flytoextentcmd.js';
import I3DSupport from '../i3dsupport.js';
import osImplements from '../implements.js';
import DragBox from './dragboxinteraction.js';


/**
 * @implements {I3DSupport}
 */
export default class DragZoom extends DragBox {
  /**
   * Constructor.
   * @param {olx.interaction.DragZoomOptions=} opt_options Options.
   */
  constructor(opt_options) {
    var options = opt_options || {};
    super({
      color: options.color || 'rgba(255,0,0,1)',
      condition: options.condition || platformModifierKeyOnly
    });

    this.type = 'dragBox';
    this.setActive(true);
  }

  /**
   * @inheritDoc
   */
  is3DSupported() {
    return true;
  }

  /**
   * @inheritDoc
   */
  end() {
    var extent = this.getGeometry().getExtent();
    var cmd = new FlyToExtent(extent, undefined, -1);

    // There has been some discussion about whether or not this command should go on the stack.
    // As of now it just executes and is not undoable.
    cmd.execute();

    // Get rid of the box
    this.cancel();
  }

  /**
   * @inheritDoc
   */
  isType() {
    // Always allow drag to zoom
    return true;
  }
}

osImplements(DragZoom, I3DSupport.ID);
