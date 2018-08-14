goog.provide('os.ui.ol.interaction.AbstractDraw');

goog.require('goog.async.Delay');
goog.require('goog.dom');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.ViewHint');
goog.require('ol.events.condition');
goog.require('ol.interaction.Pointer');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('os.ui.ol.draw.DrawEvent');
goog.require('os.ui.ol.draw.DrawEventType');



/**
 * An abstract class that serves as the base class for pointer drawing
 * interactions.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {olx.interaction.PointerOptions=} opt_options
 */
os.ui.ol.interaction.AbstractDraw = function(opt_options) {
  os.ui.ol.interaction.AbstractDraw.base(this, 'constructor', opt_options);

  /**
   * @type {boolean}
   * @protected
   */
  this.drawing = false;

  /**
   * @type {ol.EventsConditionType}
   * @protected
   */
  this.condition = goog.isDef(opt_options) && goog.isDef(opt_options.condition) ?
      opt_options.condition : ol.events.condition.shiftKeyOnly;

  /**
   * @type {string}
   * @protected
   */
  this.type = '';

  /**
   * @type {ol.style.Style}
   * @private
   */
  this.style_ = goog.isDef(opt_options) && goog.isDef(opt_options.style) ? opt_options.style : new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: [0, 0xff, 0xff, 1.0],
      lineCap: 'square',
      width: 2
    })
  });

  /**
   * @type {goog.events.KeyHandler}
   * @private
   */
  this.keyHandler_ = null;

  this.setActive(false);

  // The SINGLECLICK and DBLCLICK events are asynchronously delayed in OpenLayers to detect the existence of the
  // second click. However, all of our interactions work off of AbstractDrag or the Pointer interaction, which
  // use UP/DOWN/MOVE events in a synchronous manner. Therefore, we need to delay the removal of the
  // INTERACTING flag until we can be sure that the entire event chain from this interaction is finished.
  this.interactingFlagDelay_ = new goog.async.Delay(this.cleanupInteracting, 375, this);
};
goog.inherits(os.ui.ol.interaction.AbstractDraw, ol.interaction.Pointer);


/**
 * @type {goog.log.Logger}
 * @const
 * @private
 */
os.ui.ol.interaction.AbstractDraw.LOGGER_ =
    goog.log.getLogger('os.ui.ol.interaction.AbstractDraw');


/**
 * @return {ol.EventsConditionType}
 */
os.ui.ol.interaction.AbstractDraw.prototype.getCondition = function() {
  return this.condition;
};


/**
 * @param {ol.EventsConditionType} condition
 */
os.ui.ol.interaction.AbstractDraw.prototype.setCondition = function(condition) {
  this.condition = condition;
};


/**
 * @return {string} The type of draw interaction
 */
os.ui.ol.interaction.AbstractDraw.prototype.getType = function() {
  return this.type;
};


/**
 * Create a easy way to override type checking (for dragzoominteraction)
 * @param {string} type
 * @return {boolean}
 */
os.ui.ol.interaction.AbstractDraw.prototype.isType = function(type) {
  return this.type == type;
};


/**
 * @return {boolean} Whether or not the interaction is currently drawing
 */
os.ui.ol.interaction.AbstractDraw.prototype.getDrawing = function() {
  return this.drawing;
};


/**
 * @return {ol.style.Style|Array<ol.style.Style>} style
 */
os.ui.ol.interaction.AbstractDraw.prototype.getStyle = function() {
  return this.style_;
};


/**
 * @param {ol.style.Style} style
 */
os.ui.ol.interaction.AbstractDraw.prototype.setStyle = function(style) {
  this.style_ = style;
};


/**
 * @return {ol.geom.Geometry} the drawn geometry
 */
os.ui.ol.interaction.AbstractDraw.prototype.getGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.ui.ol.interaction.AbstractDraw.prototype.getProperties = function() {
  return null;
};


/**
 * @return {boolean} Whether or not the control is enabled
 */
os.ui.ol.interaction.AbstractDraw.prototype.getEnabled = function() {
  return this.getCondition() === ol.events.condition.always || this.getDrawing();
};


/**
 * @param {boolean} value Whether or not the control is enabled
 */
os.ui.ol.interaction.AbstractDraw.prototype.setEnabled = function(value) {
  if (value) {
    this.setCondition(ol.events.condition.always);
  } else {
    this.setCondition(ol.events.condition.shiftKeyOnly);

    if (this.drawing) {
      this.cancel();
    }
  }

  goog.log.fine(os.ui.ol.interaction.AbstractDraw.LOGGER_, this.getType() + ' interaction ' +
      (value ? 'enabled' : 'disabled'));
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.AbstractDraw.prototype.setActive = function(active) {
  var off = this.getActive() && !active;
  os.ui.ol.interaction.AbstractDraw.base(this, 'setActive', active);

  if (off && this.drawing) {
    this.cancel();
  }

  goog.log.fine(os.ui.ol.interaction.AbstractDraw.LOGGER_, this.getType() + ' interaction ' +
      (active ? 'activated' : 'deactivated'));
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.AbstractDraw.prototype.handleEvent = function(mapBrowserEvent) {
  var stopEvent = false;
  if (mapBrowserEvent.type == goog.events.KeyHandler.EventType.KEY) {
    var browserEvent = new goog.events.BrowserEvent(mapBrowserEvent.originalEvent);
    stopEvent = browserEvent.keyCode == goog.events.KeyCodes.ESC;

    if (stopEvent) {
      this.cancel();
    }
  }

  return !stopEvent;
};


/**
 * Begins drawing
 * @param {ol.MapBrowserEvent} mapBrowserEvent
 * @protected
 */
os.ui.ol.interaction.AbstractDraw.prototype.begin = function(mapBrowserEvent) {
  var map = this.getMap();

  goog.log.fine(os.ui.ol.interaction.AbstractDraw.LOGGER_, this.getType() + ' interaction begin');
  if (map && !this.drawing) {
    this.drawing = true;
    this.keyHandler_ = new goog.events.KeyHandler(goog.dom.getDocument(), true);
    this.keyHandler_.listen(goog.events.KeyHandler.EventType.KEY, this.onKey, true, this);
    map.getView().setHint(ol.ViewHint.INTERACTING, 1);
    this.dispatchEvent(new os.ui.ol.draw.DrawEvent(os.ui.ol.draw.DrawEventType.DRAWSTART,
        mapBrowserEvent.coordinate));
  }
};


/**
 * Updates the drawn feature
 * @param {ol.MapBrowserEvent} mapBrowserEvent
 * @protected
 */
os.ui.ol.interaction.AbstractDraw.prototype.update = function(mapBrowserEvent) {
};


/**
 * Ends drawing
 * @param {ol.MapBrowserEvent} mapBrowserEvent
 * @protected
 */
os.ui.ol.interaction.AbstractDraw.prototype.end = function(mapBrowserEvent) {
  if (this.drawing) {
    goog.log.info(os.ui.ol.interaction.AbstractDraw.LOGGER_, this.getType() + ' interaction complete: ' +
        this.getResultString());
    this.drawing = false;
    var geom = this.getGeometry();
    var props = this.getProperties();
    this.cleanup();
    this.dispatchEvent(new os.ui.ol.draw.DrawEvent(os.ui.ol.draw.DrawEventType.DRAWEND,
        mapBrowserEvent.coordinate, geom, mapBrowserEvent.pixel, props || undefined));
  }
};


/**
 * Cancels a drawing
 * @protected
 */
os.ui.ol.interaction.AbstractDraw.prototype.cancel = function() {
  if (this.drawing) {
    goog.log.fine(os.ui.ol.interaction.AbstractDraw.LOGGER_, this.getType() + ' interaction cancel');
    this.drawing = false;
    this.dispatchEvent(new os.ui.ol.draw.DrawEvent(os.ui.ol.draw.DrawEventType.DRAWCANCEL));
    this.cleanup();
  }
};


/**
 * Cleanup
 * @protected
 */
os.ui.ol.interaction.AbstractDraw.prototype.cleanup = function() {
  goog.log.fine(os.ui.ol.interaction.AbstractDraw.LOGGER_, this.getType() + ' interaction cleanup');
  this.interactingFlagDelay_.start();
  this.keyHandler_.unlisten(goog.events.KeyHandler.EventType.KEY, this.onKey, true, this);
  this.keyHandler_.dispose();
  this.keyHandler_ = null;
};


/**
 * Cleans up interacting flag asynchronously to clear double/single click events
 * @protected
 */
os.ui.ol.interaction.AbstractDraw.prototype.cleanupInteracting = function() {
  var map = this.getMap();
  if (map) {
    map.getView().setHint(ol.ViewHint.INTERACTING, -1);
  }
};


/**
 * Handles key events while drawing
 * @param {goog.events.KeyEvent} event
 * @protected
 */
os.ui.ol.interaction.AbstractDraw.prototype.onKey = function(event) {
  if (event.keyCode == goog.events.KeyCodes.ESC) {
    this.cancel();
  }
};


/**
 * @return {string}
 */
os.ui.ol.interaction.AbstractDraw.prototype.getResultString = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.ui.ol.interaction.AbstractDraw.prototype.dispatchEvent = function(e) {
  os.ui.ol.interaction.AbstractDraw.base(this, 'dispatchEvent', e);

  if (e instanceof ol.events.Event && e.originalEvent && e.originalEvent.defaultPrevented) {
    // don't dispatch globally if preventDefault was called
    return;
  }

  if (os.dispatcher) {
    // also dispatch globally
    os.dispatcher.dispatchEvent(e);
  }
};
