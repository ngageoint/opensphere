goog.provide('os.command.FlyToExtent');

goog.require('os.command.AbstractSyncCommand');
goog.require('os.command.State');
goog.require('os.map');



/**
 * Command to fit map to extent.
 *
 * @param {ol.Extent} extent Array of the extent box [minx, miny, maxx, maxy].
 * @param {number=} opt_buffer Scale factor for the extent to provide a buffer around the displayed area.
 * @param {number=} opt_maxZoom The maximum zoom level for the updated view. Negative values will result in
 *                              unconstrained zoom.
 *
 * @extends {os.command.AbstractSyncCommand}
 * @constructor
 */
os.command.FlyToExtent = function(extent, opt_buffer, opt_maxZoom) {
  os.command.FlyToExtent.base(this, 'constructor');
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
  this.buffer_ = opt_buffer || os.command.FlyToExtent.DEFAULT_BUFFER;

  // default to the max auto zoom. negative values will be unconstrained up to the maximum level allowed by the
  // application, and positive values will be clamped between the map's min/max allowed zoom.
  var maxZoom = os.map.MAX_AUTO_ZOOM;
  if (opt_maxZoom != null) {
    if (opt_maxZoom < 0) {
      maxZoom = os.map.MAX_ZOOM;
    } else {
      maxZoom = goog.math.clamp(opt_maxZoom, os.map.MIN_ZOOM, os.map.MAX_ZOOM);
    }
  }

  /**
   * The maximum zoom level for the updated view.
   * @type {number}
   * @private
   */
  this.maxZoom_ = maxZoom;
};
goog.inherits(os.command.FlyToExtent, os.command.AbstractSyncCommand);


/**
 * The default extent buffer.
 * @type {number}
 * @const
 */
os.command.FlyToExtent.DEFAULT_BUFFER = 1.5;


/**
 * @inheritDoc
 */
os.command.FlyToExtent.prototype.execute = function() {
  this.state = os.command.State.EXECUTING;

  var mapContainer = os.MapContainer.getInstance();

  // saving current extent
  this.oldExtent_ = mapContainer.getViewExtent().slice();

  // setting new extent
  // add a buffer around the extent so features aren't near the screen edges
  // avoid zooming too far in or the user may lose context as to where they're looking
  mapContainer.flyToExtent(this.extent_, this.buffer_, this.maxZoom_);

  return this.finish();
};


/**
 * @inheritDoc
 */
os.command.FlyToExtent.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  if (this.oldExtent_) {
    os.MapContainer.getInstance().flyToExtent(this.oldExtent_);
  }

  return os.command.FlyToExtent.base(this, 'revert');
};
