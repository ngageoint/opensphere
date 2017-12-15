goog.provide('os.control.MapMode');

goog.require('goog.dom');
goog.require('goog.dom.classlist');
goog.require('ol');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.events');
goog.require('ol.events.EventType');



/**
 * A button control to toggle between 2D and 3D views.
 * To style this control use css selector `.ol-mapmode`.
 *
 * @param {osx.control.MapModeOptions=} opt_options Map mode options.
 * @extends {ol.control.Control}
 * @constructor
 */
os.control.MapMode = function(opt_options) {
  var options = opt_options ? opt_options : {};

  var className = options.className != null ? options.className : 'ol-mapmode';
  var textClass = options.textClass != null ? options.textClass : 'ol-mapmode-text';

  /**
   * @type {Element}
   * @protected
   */
  this.content = goog.dom.createDom('SPAN', textClass);

  var tipLabel = options.tipLabel ? options.tipLabel : 'Toggle 2D/3D view';

  /**
   * @type {Element}
   * @protected
   */
  this.button = goog.dom.createDom('BUTTON', {
    'class': className + '-toggle',
    'type': 'button',
    'title': tipLabel
  }, this.content);

  ol.events.listen(this.button, ol.events.EventType.CLICK, os.control.MapMode.prototype.handleClick_, this);

  var cssClasses = className + ' ' + ol.css.CLASS_UNSELECTABLE + ' ' + ol.css.CLASS_CONTROL;
  var element = goog.dom.createDom('DIV', cssClasses, this.button);

  os.control.MapMode.base(this, 'constructor', {
    element: element,
    target: options.target
  });

  this.updateContent_();
  os.MapContainer.getInstance().listen(goog.events.EventType.PROPERTYCHANGE, this.onMapChange_, false, this);
};
goog.inherits(os.control.MapMode, ol.control.Control);


/**
 * @inheritDoc
 */
os.control.MapMode.prototype.disposeInternal = function() {
  os.MapContainer.getInstance().unlisten(goog.events.EventType.PROPERTYCHANGE, this.onMapChange_, false, this);

  if (this.button) {
    ol.events.unlisten(this.button, ol.events.EventType.CLICK, os.control.MapMode.prototype.handleClick_, this);
    this.button = null;
  }
};


/**
 * @param {Event} event The event to handle
 * @private
 */
os.control.MapMode.prototype.handleClick_ = function(event) {
  event.preventDefault();
  os.dispatcher.dispatchEvent(os.action.EventType.TOGGLE_VIEW);
};


/**
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
os.control.MapMode.prototype.onMapChange_ = function(event) {
  var p = event.getProperty();
  if (p == os.MapChange.VIEW3D) {
    this.updateContent_();
  }
};


/**
 * Update HTML content in the control.
 * @private
 */
os.control.MapMode.prototype.updateContent_ = function() {
  if (this.content) {
    goog.dom.setTextContent(this.content, os.MapContainer.getInstance().is3DEnabled() ? '3D' : '2D');
  }
};
