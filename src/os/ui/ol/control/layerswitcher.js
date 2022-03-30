goog.declareModuleId('os.ui.ol.control.LayerSwitcher');

import Control from 'ol/src/control/Control.js';
import {listen, unlistenByKey} from 'ol/src/events.js';
import Group from 'ol/src/layer/Group.js';
import PluggableMap from 'ol/src/PluggableMap.js';

const {getFirstElementChild} = goog.require('goog.dom');
const {setInnerHtml} = goog.require('goog.dom.safe');
const SafeHtml = goog.require('goog.html.SafeHtml');

/**
 * OpenLayers Layer Switcher Control.
 * See [the examples](./examples) for usage.
 */
export default class LayerSwitcher extends Control {
  /**
   * Constructor.
   * @param {Object=} opt_options Control options, extends olx.control.ControlOptions adding:
   */
  constructor(opt_options) {
    var options = opt_options || {};
    var tipLabel = options.tipLabel ? options.tipLabel : 'Legend';

    var element = document.createElement('div');

    var innerEle = document.createElement('div');
    innerEle.setAttribute('title', tipLabel);
    innerEle.className = 'layers-inner';
    element.appendChild(innerEle);

    super({
      element: element,
      target: options.target
    });

    /**
     * Listen keys for map events.
     * @type {!Array<ol.EventsKey>}
     * @protected
     */
    this.mapListeners = [];
    this.hiddenClassName = 'u-mw-75 ol-unselectable ol-control ol-layer-switcher';
    this.shownClassName = this.hiddenClassName + ' shown';

    this.panel = document.createElement('div');
    this.panel.className = 'panel d-none';

    element.className = this.hiddenClassName;
    element.appendChild(this.panel);

    /**
     * Show the layer panel.
     *
     * @param {Event} e
     */
    element.onmouseover = (e) => {
      if (this.panel.className == 'panel d-none') {
        this.showPanel();
      }
    };

    /**
     * Hide the layer panel.
     *
     * @param {Event} e
     */
    element.onmouseout = (e) => {
      e = e || window.event;
      if (!element.contains(e.toElement)) {
        if (this.panel.className == 'panel d-block') {
          this.hidePanel();
        }
      }
    };
  }

  /**
   * Show the layer panel.
   */
  showPanel() {
    this.panel.className = 'panel d-block';
    this.renderPanel();
  }

  /**
   * Hide the layer panel.
   */
  hidePanel() {
    this.panel.className = 'panel d-none';
  }

  /**
   * Re-draw the layer panel to represent the current state of the layers.
   */
  renderPanel() {
    this.ensureTopVisibleBaseLayerShown_();

    while (getFirstElementChild(this.panel)) {
      this.panel.removeChild(getFirstElementChild(this.panel));
    }

    var div = document.createElement('div');
    this.panel.appendChild(div);
    this.renderLayers_(this.getMap(), div);
  }

  /**
   * Set the map instance the control is associated with.
   *
   * @param {PluggableMap} map The map instance.
   * @override
   */
  setMap(map) {
    // Clean up listeners associated with the previous map
    this.mapListeners.forEach(unlistenByKey);
    this.mapListeners.length = 0;

    // Wire up listeners etc. and store reference to new map
    Control.prototype.setMap.call(this, map);
    if (map) {
      var this_ = this;
      this.mapListeners.push(listen(map, 'pointerdown', function() {
        this_.hidePanel();
      }));
      this.renderPanel();
    }
  }

  /**
   * Ensure only the top-most base layer is visible if more than one is visible.
   *
   * @private
   */
  ensureTopVisibleBaseLayerShown_() {
    var lastVisibleBaseLyr;
    LayerSwitcher.forEachRecursive(this.getMap(), function(l, idx, a) {
      if (l.get('type') === 'base' && l.getVisible()) {
        lastVisibleBaseLyr = l;
      }
    });
    if (lastVisibleBaseLyr) {
      this.setVisible_(lastVisibleBaseLyr, true);
    }
  }

  /**
   * Toggle the visible state of a layer.
   * Takes care of hiding other layers in the same exclusive group if the layer
   * is toggle to visible.
   *
   * @param {LayerBase} lyr The layer whos visibility will be toggled.
   * @param {boolean} visible
   * @private
   */
  setVisible_(lyr, visible) {
    var map = this.getMap();
    lyr.setVisible(visible);
    if (visible && lyr.get('type') === 'base') {
      // Hide all other base layers regardless of grouping
      LayerSwitcher.forEachRecursive(map, function(l, idx, a) {
        if (l != lyr && l.get('type') === 'base') {
          l.setVisible(false);
        }
      });
    }
  }

  /**
   * Render all layers that are children of a group.
   *
   * @param {LayerBase} lyr Layer to be rendered (should have a title property).
   * @param {number} idx Position in parent group list.
   * @return {Element} [description]
   * @private
   */
  renderLayer_(lyr, idx) {
    var this_ = this;
    var layerDiv = document.createElement('div');
    layerDiv.className = 'form-check';
    var lyrTitle = SafeHtml.htmlEscape(/** @type {string|undefined} */ (lyr.get('title')) || '');
    var lyrId = lyr.get('title').replace(' ', '-') + '_' + idx;
    var label = document.createElement('label');

    if (lyr instanceof Group) {
      layerDiv.className = 'group';
      setInnerHtml(label, lyrTitle);
      layerDiv.appendChild(label);
      var div = document.createElement('div');
      div.className = 'form-check text-truncate';
      layerDiv.appendChild(div);
      this.renderLayers_(lyr, div);
    } else {
      var input = document.createElement('input');
      if (lyr.get('type') === 'base') {
        input.type = 'radio';
        input.name = 'base';
      } else {
        input.type = 'checkbox';
      }
      input.id = lyrId;
      input.className = 'form-check-input';
      input.checked = lyr.get('visible');
      input.onchange = function(e) {
        this_.setVisible_(lyr, e.target.checked);
      };
      layerDiv.appendChild(input);
      label.htmlFor = lyrId;
      setInnerHtml(label, lyrTitle);
      label.className = 'form-check-label';
      layerDiv.appendChild(label);
    }

    return layerDiv;
  }

  /**
   * Render all layers that are children of a group.
   *
   * @private
   * @param {(Group|PluggableMap)} lyr Group layer whos children will be rendered.
   * @param {Element} elm DOM element that children will be appended to.
   */
  renderLayers_(lyr, elm) {
    var lyrs = lyr.getLayers().getArray().slice().reverse();
    for (var i = 0, l; i < lyrs.length; i++) {
      l = lyrs[i];
      if (l.get('title')) {
        elm.appendChild(this.renderLayer_(l, i));
      }
    }
  }

  /**
   * Get the element
   *
   * @return {Element}
   */
  getElement() {
    return this.element;
  }

  /**
   * **Static** Call the supplied function for each layer in the passed layer group
   * recursing nested groups.
   *
   * @param {(Group|PluggableMap)} lyr The layer group to start iterating from.
   * @param {Function} fn Callback which will be called for each `ol.layer.Base`
   * found under `lyr`. The signature for `fn` is the same as `ol.Collection#forEach`
   */
  static forEachRecursive(lyr, fn) {
    lyr.getLayers().forEach(function(lyr, idx, a) {
      fn(lyr, idx, a);
      if (lyr instanceof Group || lyr instanceof PluggableMap) {
        LayerSwitcher.forEachRecursive(lyr, fn);
      }
    });
  }
}
