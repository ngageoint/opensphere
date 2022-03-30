goog.declareModuleId('plugin.track.TrackInteraction');

import OlStroke from 'ol/src/style/Stroke.js';
import OlStyle from 'ol/src/style/Style.js';
import MeasureInteraction from '../../os/interaction/measureinteraction.js';
import * as osObject from '../../os/object/object.js';
import {LINE_STYLE_OPTIONS} from '../../os/style/style.js';


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
export default class TrackInteraction extends MeasureInteraction {
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
   * Set up the interaction for the next run
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

  /**
   * Either,
   * 1) Immediately enable and begin TrackInteraction from the original right-click event, OR
   * 2) Disable and deactivate the TrackInteraction
   *
   * @param {boolean} toggle
   * @param {MapBrowserEvent=} opt_mapBrowserEvent
   * @param {pluginx.track.TrackOptions=} opt_trackOptions starting point, callback, etc
   * @suppress {const}
   */
  trigger(toggle, opt_mapBrowserEvent, opt_trackOptions) {
    if (toggle && opt_trackOptions) {
      this.config(opt_trackOptions);
    }

    this.setEnabled(toggle);
    this.setActive(toggle);

    if (toggle && opt_mapBrowserEvent) {
      let event;

      // prime the coordinates of the pointerdown event for the DrawInteraction part of TrackInteraction
      event = opt_mapBrowserEvent;
      event.type = 'pointerdown';
      event.originalEvent = new PointerEvent('pointerdown');
      this.handleEvent(event);

      // trigger the TrackInteraction begin() with a pointerup event
      event = opt_mapBrowserEvent;
      event.type = 'pointerup';
      event.originalEvent = new PointerEvent('pointerup');
      this.handleEvent(event);
    }
  }
}

// export this constant
TrackInteraction.DEFAULT_STYLE = DEFAULT_STYLE;
