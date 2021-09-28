goog.declareModuleId('os.ui.ol.interaction.AbstractDraw');

import * as dispatcher from '../../../dispatcher.js';
import DrawEvent from '../../draw/drawevent.js';
import DrawEventType from '../../draw/draweventtype.js';

const {getDocument} = goog.require('goog.dom');
const BrowserEvent = goog.require('goog.events.BrowserEvent');
const KeyCodes = goog.require('goog.events.KeyCodes');
const KeyEvent = goog.require('goog.events.KeyEvent');
const KeyHandler = goog.require('goog.events.KeyHandler');
const log = goog.require('goog.log');
const ViewHint = goog.require('ol.ViewHint');
const Event = goog.require('ol.events.Event');
const {always, shiftKeyOnly} = goog.require('ol.events.condition');
const Pointer = goog.require('ol.interaction.Pointer');
const Fill = goog.require('ol.style.Fill');
const Stroke = goog.require('ol.style.Stroke');
const Style = goog.require('ol.style.Style');
const Text = goog.require('ol.style.Text');

const Logger = goog.requireType('goog.log.Logger');
const MapBrowserEvent = goog.requireType('ol.MapBrowserEvent');
const Geometry = goog.requireType('ol.geom.Geometry');


/**
 * An abstract class that serves as the base class for pointer drawing
 * interactions.
 *
 * @abstract
 */
export default class AbstractDraw extends Pointer {
  /**
   * Constructor.
   * @param {olx.interaction.PointerOptions=} opt_options
   */
  constructor(opt_options) {
    super(opt_options);

    /**
     * @type {boolean}
     * @protected
     */
    this.drawing = false;

    /**
     * @type {ol.EventsConditionType}
     * @protected
     */
    this.condition = opt_options !== undefined && opt_options.condition !== undefined ?
      opt_options.condition : shiftKeyOnly;

    /**
     * @type {string}
     * @protected
     */
    this.type = '';

    /**
     * @type {Style|Array<ol.style.Style>}
     * @private
     */
    this.style_ = opt_options !== undefined && opt_options.style !== undefined ? opt_options.style : [
      new Style({
        stroke: new Stroke({
          color: [0, 0xff, 0xff, 1.0],
          lineCap: 'square',
          width: 2
        })
      }),
      new Style({
        text: new Text({
          stroke: new Stroke({
            width: 2,
            color: [0, 0, 0, 1.0]
          }),
          fill: new Fill({
            color: [0xff, 0xff, 0xff, 1.0]
          }),
          textAlign: 'left'
        })
      })];

    /**
     * @type {KeyHandler}
     * @private
     */
    this.keyHandler_ = null;

    this.setActive(false);
  }

  /**
   * @return {ol.EventsConditionType}
   */
  getCondition() {
    return this.condition;
  }

  /**
   * @param {ol.EventsConditionType} condition
   */
  setCondition(condition) {
    this.condition = condition;
  }

  /**
   * @return {string} The type of draw interaction
   */
  getType() {
    return this.type;
  }

  /**
   * Create a easy way to override type checking (for dragzoominteraction)
   *
   * @param {string} type
   * @return {boolean}
   */
  isType(type) {
    return this.type == type;
  }

  /**
   * @return {boolean} Whether or not the interaction is currently drawing
   */
  getDrawing() {
    return this.drawing;
  }

  /**
   * @return {Style|Array<Style>} style
   */
  getStyle() {
    return this.style_;
  }

  /**
   * @param {Style|Array<Style>} style
   */
  setStyle(style) {
    this.style_ = style;
  }

  /**
   * @abstract
   * @return {Geometry} the drawn geometry
   */
  getGeometry() {}

  /**
   * @inheritDoc
   */
  getProperties() {
    return null;
  }

  /**
   * @return {boolean} Whether or not the control is enabled
   */
  getEnabled() {
    return this.getCondition() === always || this.getDrawing();
  }

  /**
   * @param {boolean} value Whether or not the control is enabled
   */
  setEnabled(value) {
    if (value) {
      this.setCondition(always);
    } else {
      this.setCondition(shiftKeyOnly);

      if (this.drawing) {
        this.cancel();
      }
    }

    log.fine(logger, this.getType() + ' interaction ' +
        (value ? 'enabled' : 'disabled'));
  }

  /**
   * @inheritDoc
   */
  setActive(active) {
    var off = this.getActive() && !active;
    super.setActive(active);

    if (off && this.drawing) {
      this.cancel();
    }

    log.fine(logger, this.getType() + ' interaction ' +
        (active ? 'activated' : 'deactivated'));
  }

  /**
   * @inheritDoc
   */
  handleEvent(mapBrowserEvent) {
    var stopEvent = false;
    if (mapBrowserEvent.type == KeyEvent.EventType.KEY) {
      var browserEvent = new BrowserEvent(mapBrowserEvent.originalEvent);
      stopEvent = browserEvent.keyCode == KeyCodes.ESC;

      if (stopEvent) {
        this.cancel();
      }
    }

    return !stopEvent;
  }

  /**
   * Begins drawing
   *
   * @param {MapBrowserEvent} mapBrowserEvent
   * @protected
   */
  begin(mapBrowserEvent) {
    var map = this.getMap();

    log.fine(logger, this.getType() + ' interaction begin');
    if (map && !this.drawing) {
      this.drawing = true;
      this.keyHandler_ = new KeyHandler(getDocument(), true);
      this.keyHandler_.listen(KeyEvent.EventType.KEY, this.onKey, true, this);
      map.getView().setHint(ViewHint.INTERACTING, 1);
      this.dispatchEvent(new DrawEvent(DrawEventType.DRAWSTART,
          mapBrowserEvent.coordinate));
    }
  }

  /**
   * Updates the drawn feature
   *
   * @param {MapBrowserEvent} mapBrowserEvent
   * @protected
   */
  update(mapBrowserEvent) {
  }

  /**
   * Ends drawing
   *
   * @param {MapBrowserEvent} mapBrowserEvent
   * @protected
   */
  end(mapBrowserEvent) {
    if (this.drawing) {
      log.info(logger, this.getType() + ' interaction complete: ' +
          this.getResultString());
      this.drawing = false;
      var geom = this.getGeometry();
      var props = this.getProperties();
      this.cleanup();
      this.dispatchEvent(new DrawEvent(DrawEventType.DRAWEND,
          mapBrowserEvent.coordinate, geom, mapBrowserEvent.pixel, props || undefined));

      // drawing completed, so prevent the event from propagating to further handlers
      mapBrowserEvent.preventDefault();
    }
  }

  /**
   * Cancels a drawing
   *
   * @protected
   */
  cancel() {
    if (this.drawing) {
      log.fine(logger, this.getType() + ' interaction cancel');
      this.drawing = false;
      this.dispatchEvent(new DrawEvent(DrawEventType.DRAWCANCEL));
      this.cleanup();
    }
  }

  /**
   * Cleanup
   *
   * @protected
   */
  cleanup() {
    var map = this.getMap();
    if (map) {
      log.fine(logger, this.getType() + ' interaction cleanup');
      map.getView().setHint(ViewHint.INTERACTING, -1);
    }

    if (this.keyHandler_) {
      this.keyHandler_.unlisten(KeyEvent.EventType.KEY, this.onKey, true, this);
      this.keyHandler_.dispose();
      this.keyHandler_ = null;
    }
  }

  /**
   * Handles key events while drawing
   *
   * @param {KeyEvent} event
   * @protected
   */
  onKey(event) {
    if (event.keyCode == KeyCodes.ESC) {
      this.cancel();
    }
  }

  /**
   * @abstract
   * @return {string}
   */
  getResultString() {}

  /**
   * @inheritDoc
   */
  dispatchEvent(e) {
    super.dispatchEvent(e);

    if (e instanceof Event && e.originalEvent && e.originalEvent.defaultPrevented) {
      // don't dispatch globally if preventDefault was called
      return;
    }

    if (dispatcher.getInstance()) {
      // also dispatch globally
      dispatcher.getInstance().dispatchEvent(e);
    }
  }
}

/**
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.ol.interaction.AbstractDraw');
