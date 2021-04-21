goog.module('plugin.track.TrackInteraction');

const osObject = goog.require('os.object');
const {LINE_STYLE_OPTIONS} = goog.require('os.style');
const MeasureInteraction = goog.require('os.interaction.Measure');
// const OlMapBrowserEvent = goog.require('ol.MapBrowserEvent');
const OlStroke = goog.require('ol.style.Stroke');
const OlStyle = goog.require('ol.style.Style');

const OlLineString = goog.requireType('ol.geom.LineString');

/**
 * @const
 * @type {OlStyle}
 */
const DEFAULT_STYLE = new OlStyle({
  stroke: new OlStroke({
    color: [255, 255, 255, .45],
    lineCap: 'square',
    lineDash: LINE_STYLE_OPTIONS[6].pattern,
    width: 2
  })
});

/**
 * Behaves the same as a MeasureInteraction, but 3D.
 *
 * Instead of generating a Line drawing on end(), it passes the point(s) back to the caller.
 *
 * @extends {MeasureInteraction}
 */
class TrackInteraction extends MeasureInteraction {
  /**
   * @param {olx.interaction.PointerOptions=} opt_options
   */
  constructor(opt_options) {
    super(opt_options);

    /**
     * @type {(pluginx.track.TrackOptions|null|undefined)}
     * @protected
     */
    this.config_ = null;

    this.type = 'track';

    this.color = [255, 255, 255, .45];

    this.setStyle(DEFAULT_STYLE);
  }

  /**
   * @param {pluginx.track.TrackOptions=} opt_trackOptions starting point, callback, etc
   */
  config(opt_trackOptions) {
    this.coords.length = 0;
    this.config_ = opt_trackOptions;

    if (opt_trackOptions && opt_trackOptions.track) {
      const track = opt_trackOptions.track;

      // get beginning position of the drawing
      const coord = /** @type {OlLineString} */ (track.getGeometry()).getLastCoordinate();
      if (coord) {
        // this.begin();
        this.coords.push(coord);
      }
    }
  }

  /**
   * @inheritDoc
   */
  begin(mapBrowserEvent) {
    super.begin(mapBrowserEvent);

    if (this.config_ && this.config_.track) {
      this.coords.length = 0;
      const track = this.config_.track;

      // get beginning position of the drawing
      const coord = /** @type {OlLineString} */ (track.getGeometry()).getLastCoordinate();
      if (coord) {
        // this.begin();
        this.coords.push(coord);
      }
    }
  }

  /**
   * @inheritDoc
   */
  end(mapBrowserEvent) {
    const all = osObject.unsafeClone(this.coords);

    super.end(mapBrowserEvent);

    if (this.config_) {
      this.config_.callback(all);
    }
  }
}

// export this constant
TrackInteraction.DEFAULT_STYLE = DEFAULT_STYLE;

exports = TrackInteraction;
