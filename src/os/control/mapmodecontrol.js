goog.declareModuleId('os.control.MapMode');

import Control from 'ol/src/control/Control.js';
import {CLASS_UNSELECTABLE, CLASS_CONTROL} from 'ol/src/css.js';
import EventType from 'ol/src/events/EventType.js';
import {listen, unlistenByKey} from 'ol/src/events.js';

import osActionEventType from '../action/eventtype.js';
import * as dispatcher from '../dispatcher.js';
import MapChange from '../map/mapchange.js';
import {getMapContainer} from '../map/mapinstance.js';

const dom = goog.require('goog.dom');
const GoogEventType = goog.require('goog.events.EventType');

const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');


/**
 * A button control to toggle between 2D and 3D views.
 * To style this control use css selector `.ol-mapmode`.
 */
export default class MapMode extends Control {
  /**
   * Constructor.
   * @param {osx.control.MapModeOptions=} opt_options Map mode options.
   */
  constructor(opt_options) {
    var options = opt_options ? opt_options : {};

    var className = options.className != null ? options.className : 'ol-mapmode';
    var textClass = options.textClass != null ? options.textClass : 'ol-mapmode-text';
    var content = dom.createDom('SPAN', textClass);
    var cssClasses = className + ' ' + CLASS_UNSELECTABLE + ' ' + CLASS_CONTROL;
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

    this.listenKey = listen(this.button, EventType.CLICK, MapMode.prototype.handleClick_, this);

    this.updateContent_();
    getMapContainer().listen(GoogEventType.PROPERTYCHANGE, this.onMapChange_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    getMapContainer().unlisten(GoogEventType.PROPERTYCHANGE, this.onMapChange_, false, this);

    if (this.button) {
      unlistenByKey(this.listenKey);
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
   * @param {PropertyChangeEvent} event The event.
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
