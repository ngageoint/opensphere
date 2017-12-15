goog.provide('plugin.arc.layer.AnimatedArcTile');
goog.require('os.layer.AnimatedTile');
goog.require('os.time');
goog.require('os.time.TimelineController');



/**
 * Extension of AnimatedTile for slightly different date formatting purposes.
 * @extends {os.layer.AnimatedTile}
 * @param {olx.layer.TileOptions} options Tile layer options
 * @constructor
 */
plugin.arc.layer.AnimatedArcTile = function(options) {
  plugin.arc.layer.AnimatedArcTile.base(this, 'constructor', options);
};
goog.inherits(plugin.arc.layer.AnimatedArcTile, os.layer.AnimatedTile);


/**
 * @inheritDoc
 */
plugin.arc.layer.AnimatedArcTile.prototype.getFormattedDate = function() {
  var tlc = os.time.TimelineController.getInstance();
  var duration = tlc.getDuration();
  var start = duration == 'custom' ? tlc.getStart() : tlc.getCurrent() - tlc.getOffset();
  var end = tlc.getCurrent();

  if (duration != 'custom') {
    start = end = (start + end) / 2;
  }

  var flooredStart = os.time.floor(new Date(start), duration);
  var cappedEnd = os.time.ceil(new Date(end), duration);

  // if the capped start/end times are the same, we're on a boundary. take the next duration instead.
  cappedEnd = cappedEnd.getTime() == flooredStart.getTime() ? os.time.ceil(new Date(end), duration) : cappedEnd;

  return flooredStart.getTime() + ',' + cappedEnd.getTime();
};
