goog.module('os.interaction.DragZoom');

const {platformModifierKeyOnly} = goog.require('ol.events.condition');
const I3DSupport = goog.require('os.I3DSupport');
const FlyToExtent = goog.require('os.command.FlyToExtent');
const osImplements = goog.require('os.implements');
const DragBox = goog.require('os.interaction.DragBox');


/**
 * @implements {I3DSupport}
 */
class DragZoom extends DragBox {
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

exports = DragZoom;
