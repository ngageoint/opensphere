goog.provide('os.ui.ol.control.LayerSwitcher');

goog.require('goog.dom.safe');
goog.require('goog.html.SafeHtml');
goog.require('ol.Observable');
goog.require('ol.control.Control');
goog.require('ol.events');
goog.require('ol.layer.Group');



/**
 * OpenLayers 3 Layer Switcher Control.
 * See [the examples](./examples) for usage.
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} opt_options Control options, extends olx.control.ControlOptions adding:
 */
os.ui.ol.control.LayerSwitcher = function(opt_options) {
  var options = opt_options || {};
  var tipLabel = options.tipLabel ? options.tipLabel : 'Legend';

  /**
   * Listen keys for map events.
   * @type {!Array<ol.EventsKey>}
   * @protected
   */
  this.mapListeners = [];
  this.hiddenClassName = 'u-mw-75 ol-unselectable ol-control ol-layer-switcher';
  this.shownClassName = this.hiddenClassName + ' shown';

  var element = document.createElement('div');
  element.className = this.hiddenClassName;

  var innerEle = document.createElement('div');
  innerEle.setAttribute('title', tipLabel);
  innerEle.className = 'layers-inner';
  element.appendChild(innerEle);

  this.panel = document.createElement('div');
  this.panel.className = 'panel d-none';
  element.appendChild(this.panel);

  var this_ = this;

  /**
   * Show the layer panel.
   * @param {Event} e
   */
  element.onmouseover = function(e) {
    if (this_.panel.className == 'panel d-none') {
      this_.showPanel();
    }
  };

  /**
   * Hide the layer panel.
   * @param {Event} e
   */
  element.onmouseout = function(e) {
    e = e || window.event;
    if (!element.contains(e.toElement)) {
      if (this_.panel.className == 'panel d-block') {
        this_.hidePanel();
      }
    }
  };

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });
};
ol.inherits(os.ui.ol.control.LayerSwitcher, ol.control.Control);


/**
 * Show the layer panel.
 */
os.ui.ol.control.LayerSwitcher.prototype.showPanel = function() {
  this.panel.className = 'panel d-block';
  this.renderPanel();
};


/**
 * Hide the layer panel.
 */
os.ui.ol.control.LayerSwitcher.prototype.hidePanel = function() {
  this.panel.className = 'panel d-none';
};


/**
 * Re-draw the layer panel to represent the current state of the layers.
 */
os.ui.ol.control.LayerSwitcher.prototype.renderPanel = function() {
  this.ensureTopVisibleBaseLayerShown_();

  while (goog.dom.getFirstElementChild(this.panel)) {
    this.panel.removeChild(goog.dom.getFirstElementChild(this.panel));
  }

  var div = document.createElement('div');
  this.panel.appendChild(div);
  this.renderLayers_(this.getMap(), div);
};


/**
 * Set the map instance the control is associated with.
 * @param {ol.PluggableMap} map The map instance.
 * @override
 */
os.ui.ol.control.LayerSwitcher.prototype.setMap = function(map) {
  // Clean up listeners associated with the previous map
  this.mapListeners.forEach(ol.events.unlistenByKey);
  this.mapListeners.length = 0;

  // Wire up listeners etc. and store reference to new map
  ol.control.Control.prototype.setMap.call(this, map);
  if (map) {
    var this_ = this;
    this.mapListeners.push(ol.events.listen(map, 'pointerdown', function() {
      this_.hidePanel();
    }));
    this.renderPanel();
  }
};


/**
 * Ensure only the top-most base layer is visible if more than one is visible.
 * @private
 */
os.ui.ol.control.LayerSwitcher.prototype.ensureTopVisibleBaseLayerShown_ = function() {
  var lastVisibleBaseLyr;
  os.ui.ol.control.LayerSwitcher.forEachRecursive(this.getMap(), function(l, idx, a) {
    if (l.get('type') === 'base' && l.getVisible()) {
      lastVisibleBaseLyr = l;
    }
  });
  if (lastVisibleBaseLyr) {
    this.setVisible_(lastVisibleBaseLyr, true);
  }
};


/**
 * Toggle the visible state of a layer.
 * Takes care of hiding other layers in the same exclusive group if the layer
 * is toggle to visible.
 * @param {ol.layer.Base} lyr The layer whos visibility will be toggled.
 * @param {boolean} visible
 * @private
 */
os.ui.ol.control.LayerSwitcher.prototype.setVisible_ = function(lyr, visible) {
  var map = this.getMap();
  lyr.setVisible(visible);
  if (visible && lyr.get('type') === 'base') {
    // Hide all other base layers regardless of grouping
    os.ui.ol.control.LayerSwitcher.forEachRecursive(map, function(l, idx, a) {
      if (l != lyr && l.get('type') === 'base') {
        l.setVisible(false);
      }
    });
  }
};


/**
 * Render all layers that are children of a group.
 * @param {ol.layer.Base} lyr Layer to be rendered (should have a title property).
 * @param {number} idx Position in parent group list.
 * @return {Element} [description]
 * @private
 */
os.ui.ol.control.LayerSwitcher.prototype.renderLayer_ = function(lyr, idx) {
  var this_ = this;
  var layerDiv = document.createElement('div');
  layerDiv.className = 'form-check';
  var lyrTitle = goog.html.SafeHtml.htmlEscape(/** @type {string|undefined} */ (lyr.get('title')) || '');
  var lyrId = lyr.get('title').replace(' ', '-') + '_' + idx;
  var label = document.createElement('label');

  if (lyr instanceof ol.layer.Group) {
    layerDiv.className = 'group';
    goog.dom.safe.setInnerHtml(label, lyrTitle);
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
    input.onchange = goog.bind(function(e) {
      this_.setVisible_(lyr, e.target.checked);
    }, this);
    layerDiv.appendChild(input);
    label.htmlFor = lyrId;
    goog.dom.safe.setInnerHtml(label, lyrTitle);
    label.className = 'form-check-label';
    layerDiv.appendChild(label);
  }

  return layerDiv;
};


/**
 * Render all layers that are children of a group.
 * @private
 * @param {(ol.layer.Group|ol.PluggableMap)} lyr Group layer whos children will be rendered.
 * @param {Element} elm DOM element that children will be appended to.
 */
os.ui.ol.control.LayerSwitcher.prototype.renderLayers_ = function(lyr, elm) {
  var lyrs = lyr.getLayers().getArray().slice().reverse();
  for (var i = 0, l; i < lyrs.length; i++) {
    l = lyrs[i];
    if (l.get('title')) {
      elm.appendChild(this.renderLayer_(l, i));
    }
  }
};


/**
 * **Static** Call the supplied function for each layer in the passed layer group
 * recursing nested groups.
 * @param {(ol.layer.Group|ol.PluggableMap)} lyr The layer group to start iterating from.
 * @param {Function} fn Callback which will be called for each `ol.layer.Base`
 * found under `lyr`. The signature for `fn` is the same as `ol.Collection#forEach`
 */
os.ui.ol.control.LayerSwitcher.forEachRecursive = function(lyr, fn) {
  lyr.getLayers().forEach(function(lyr, idx, a) {
    fn(lyr, idx, a);
    if (lyr instanceof ol.layer.Group || lyr instanceof ol.PluggableMap) {
      os.ui.ol.control.LayerSwitcher.forEachRecursive(lyr, fn);
    }
  });
};


/**
 * Get the element
 * @return {Element}
 */
os.ui.ol.control.LayerSwitcher.prototype.getElement = function() {
  return this.element;
};
