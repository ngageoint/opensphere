goog.declareModuleId('os.ui.ol.interaction.AbstractDraw');

import {always, shiftKeyOnly} from 'ol/src/events/condition.js';
import Event from 'ol/src/events/Event.js';
import Pointer from 'ol/src/interaction/Pointer.js';
import Fill from 'ol/src/style/Fill.js';
import Stroke from 'ol/src/style/Stroke.js';
import Style from 'ol/src/style/Style.js';
import Text from 'ol/src/style/Text.js';
import ViewHint from 'ol/src/ViewHint.js';

import * as dispatcher from '../../../dispatcher.js';
import DrawEvent from '../../draw/drawevent.js';
import DrawEventType from '../../draw/draweventtype.js';

const {getDocument} = goog.require('goog.dom');
const BrowserEvent = goog.require('goog.events.BrowserEvent');
const KeyCodes = goog.require('goog.events.KeyCodes');
const KeyEvent = goog.require('goog.events.KeyEvent');
const KeyHandler = goog.require('goog.events.KeyHandler');
const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');

/**
 * This drawing flag explains whether or not another interaction
 * besides the current interaction is drawing.
 * @type {boolean}
 */
let drawing = false;


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
     * This drawing flag explains whether or not the current interaction is drawing.
     * @type {boolean}
     * @protected
     */
    this.drawing = false;

    const condition = opt_options && opt_options.condition ? opt_options.condition : shiftKeyOnly;
    /**
     * The current condition function. Change this to change the interaction condition.
     * @type {ol.EventsConditionType}
     * @protected
     */
    this.condition = condition;

    /**
     * The default condition. This should not be changed and gets set back on completion of the interaction.
     * @type {ol.EventsConditionType}
     * @protected
     */
    this.defaultCondition = condition;

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
      this.setCondition(this.defaultCondition);

      if (this.drawing) {
        this.cancel();
      }
    }

    log.fine(logger, this.getType() + ' interaction ' + (value ? 'enabled' : 'disabled'));
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
      drawing = true;
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
      drawing = false;
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
      drawing = false;
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

  /**
   * If another draw control is currently active.
   * @return {boolean}
   * @protected
   */
  getOtherDrawing() {
    return !this.drawing && drawing;
  }
}

/**
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.ol.interaction.AbstractDraw');
