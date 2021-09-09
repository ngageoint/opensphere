goog.module('os.control.MapMode');

const dom = goog.require('goog.dom');
const GoogEventType = goog.require('goog.events.EventType');
const Control = goog.require('ol.control.Control');
const css = goog.require('ol.css');
const events = goog.require('ol.events');
const EventType = goog.require('ol.events.EventType');
const dispatcher = goog.require('os.Dispatcher');
const MapChange = goog.require('os.MapChange');
const osActionEventType = goog.require('os.action.EventType');
const {getMapContainer} = goog.require('os.map.instance');


/**
 * A button control to toggle between 2D and 3D views.
 * To style this control use css selector `.ol-mapmode`.
 */
class MapMode extends Control {
  /**
   * Constructor.
   * @param {osx.control.MapModeOptions=} opt_options Map mode options.
   */
  constructor(opt_options) {
    var options = opt_options ? opt_options : {};

    var className = options.className != null ? options.className : 'ol-mapmode';
    var textClass = options.textClass != null ? options.textClass : 'ol-mapmode-text';
    var content = dom.createDom('SPAN', textClass);
    var cssClasses = className + ' ' + css.CLASS_UNSELECTABLE + ' ' + css.CLASS_CONTROL;
    var defaultTooltip = options.tipLabel ? options.tipLabel : 'Toggle 2D/3D view';

    var button = dom.createDom('BUTTON', {
      'class': className + '-toggle',
      'type': 'button',
      'title': defaultTooltip
    }, content);

    var element = dom.createDom('DIV', cssClasses, button);

    super({
      element: element,
      target: options.target
    });

    /**
     * Default tooltip to display on the button.
     * @type {string}
     * @protected
     */
    this.defaultTooltip = defaultTooltip;

    /**
     * The control content element.
     * @type {Element|undefined}
     * @protected
     */
    this.content = content;

    /**
     * Element to display when the map view is loading.
     * @type {Element|undefined}
     * @protected
     */
    this.loadingEl = dom.createDom('I', 'fa fa-spin fa-spinner');

    /**
     * @type {Element|undefined}
     * @protected
     */
    this.button = button;

    events.listen(this.button, EventType.CLICK, MapMode.prototype.handleClick_, this);

    this.updateContent_();
    getMapContainer().listen(GoogEventType.PROPERTYCHANGE, this.onMapChange_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    getMapContainer().unlisten(GoogEventType.PROPERTYCHANGE, this.onMapChange_, false, this);

    if (this.button) {
      events.unlisten(this.button, EventType.CLICK, MapMode.prototype.handleClick_, this);
      this.button = undefined;
    }

    this.content = undefined;
    this.loadingEl = undefined;
  }

  /**
   * Handle click events on the control.
   *
   * @param {Event} event The event.
   * @private
   */
  handleClick_(event) {
    event.preventDefault();
    dispatcher.getInstance().dispatchEvent(osActionEventType.TOGGLE_VIEW);
  }

  /**
   * Handle property change events from the map container.
   *
   * @param {os.events.PropertyChangeEvent} event The event.
   * @private
   */
  onMapChange_(event) {
    var p = event.getProperty();
    if (p === MapChange.INIT3D || p === MapChange.VIEW3D) {
      this.updateContent_();
    }
  }

  /**
   * Update HTML content in the control.
   *
   * @private
   */
  updateContent_() {
    if (this.button && this.content && this.loadingEl) {
      var map = getMapContainer();
      if (map.isInitializingWebGL()) {
        dom.setTextContent(this.content, '');
        this.content.appendChild(this.loadingEl);
        this.button.title = 'Initializing 3D view';
      } else {
        dom.removeNode(this.loadingEl);
        dom.setTextContent(this.content, map.is3DEnabled() ? '3D' : '2D');
        this.button.title = this.defaultTooltip;
      }
    }
  }
}

exports = MapMode;
