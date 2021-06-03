goog.module('os.command.FlyToExtent');
goog.module.declareLegacyNamespace();

const math = goog.require('goog.math');
const MapContainer = goog.require('os.MapContainer');
const AbstractSyncCommand = goog.require('os.command.AbstractSyncCommand');
const State = goog.require('os.command.State');
const osMap = goog.require('os.map');


/**
 * Command to fit map to extent.
 */
class FlyToExtent extends AbstractSyncCommand {
  /**
   * Constructor.
   * @param {ol.Extent} extent Array of the extent box [minx, miny, maxx, maxy].
   * @param {number=} opt_buffer Scale factor for the extent to provide a buffer around the displayed area.
   * @param {number=} opt_maxZoom The maximum zoom level for the updated view. Negative values will result in
   *                              unconstrained zoom.
   */
  constructor(extent, opt_buffer, opt_maxZoom) {
    super();
    this.title = 'Fit Map to Extent';

    /**
     * The target zoom extent.
     * @type {ol.Extent}
     * @private
     */
    this.extent_ = extent;

    /**
     * The map extent prior to zooming.
     * @type {ol.Extent|undefined}
     * @private
     */
    this.oldExtent_ = undefined;

    /**
     * Scale factor for the extent to provide a buffer around the displayed area.
     * @type {number|undefined}
     * @private
     */
    this.buffer_ = opt_buffer || FlyToExtent.DEFAULT_BUFFER;

    // default to the max auto zoom. negative values will be unconstrained up to the maximum level allowed by the
    // application, and positive values will be clamped between the map's min/max allowed zoom.
    var maxZoom = osMap.MAX_AUTO_ZOOM;
    if (opt_maxZoom != null) {
      if (opt_maxZoom < 0) {
        maxZoom = osMap.MAX_ZOOM;
      } else {
        maxZoom = math.clamp(opt_maxZoom, osMap.MIN_ZOOM, osMap.MAX_ZOOM);
      }
    }

    /**
     * The maximum zoom level for the updated view.
     * @type {number}
     * @private
     */
    this.maxZoom_ = maxZoom;
  }

  /**
   * @inheritDoc
   */
  execute() {
    this.state = State.EXECUTING;

    var mapContainer = MapContainer.getInstance();

    // saving current extent
    this.oldExtent_ = mapContainer.getViewExtent().slice();

    // setting new extent
    // add a buffer around the extent so features aren't near the screen edges
    // avoid zooming too far in or the user may lose context as to where they're looking
    mapContainer.flyToExtent(this.extent_, this.buffer_, this.maxZoom_);

    return this.finish();
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;

    if (this.oldExtent_) {
      MapContainer.getInstance().flyToExtent(this.oldExtent_);
    }

    return super.revert();
  }
}


/**
 * The default extent buffer.
 * @type {number}
 * @const
 */
FlyToExtent.DEFAULT_BUFFER = 1.5;


exports = FlyToExtent;
