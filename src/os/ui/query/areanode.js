goog.provide('os.ui.query.AreaNode');
goog.require('ol.events');
goog.require('os.data.ISearchable');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.structs.TriState');
goog.require('os.tag');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Tree nodes for areas
 * @extends {os.ui.slick.SlickTreeNode}
 * @implements {os.data.ISearchable}
 * @param {ol.Feature=} opt_area
 * @constructor
 */
os.ui.query.AreaNode = function(opt_area) {
  os.ui.query.AreaNode.base(this, 'constructor');

  /**
   * @type {?ol.Feature}
   * @protected
   */
  this.area = null;

  if (opt_area) {
    this.setArea(opt_area);
  }
};
goog.inherits(os.ui.query.AreaNode, os.ui.slick.SlickTreeNode);


/**
 * @inheritDoc
 */
os.ui.query.AreaNode.prototype.disposeInternal = function() {
  os.ui.query.AreaNode.base(this, 'disposeInternal');
  this.setArea(null);
};


/**
 * @return {?ol.Feature} the area
 */
os.ui.query.AreaNode.prototype.getArea = function() {
  return this.area;
};


/**
 * Sets the area
 * @param {?ol.Feature} area the area
 */
os.ui.query.AreaNode.prototype.setArea = function(area) {
  if (this.area) {
    ol.events.unlisten(this.area, 'toggle', this.onAreaToggled, this);
  }

  this.area = area;
  this.updateFromArea();

  if (this.area) {
    ol.events.listen(this.area, 'toggle', this.onAreaToggled, this);
  }
};


/**
 * Update the node from the current area.
 * @protected
 */
os.ui.query.AreaNode.prototype.updateFromArea = function() {
  this.setId(this.getId());
  this.setLabel(this.getLabel());

  if (this.area) {
    this.setToolTip(/** @type {string} */ (this.area.get('description') || ''));
    this.setState(this.area.get('shown') ? os.structs.TriState.ON : os.structs.TriState.OFF);
  }
};


/**
 * @inheritDoc
 */
os.ui.query.AreaNode.prototype.setState = function(value) {
  if (value !== os.structs.TriState.BOTH) {
    var old = this.getState();
    os.ui.query.AreaNode.base(this, 'setState', value);
    var s = this.getState();

    if (old != s && this.area) {
      var show = s !== os.structs.TriState.OFF;
      var shown = /** @type {boolean} */ (this.area.get('shown'));

      if (show !== shown) {
        this.area.set('shown', show);
        this.area.dispatchEvent('toggle');
      }
    }
  }
};


/**
 * @param {goog.events.Event} event
 * @protected
 */
os.ui.query.AreaNode.prototype.onAreaToggled = function(event) {
  this.setState(this.area.get('shown') ? os.structs.TriState.ON : os.structs.TriState.OFF);
};


/**
 * @inheritDoc
 */
os.ui.query.AreaNode.prototype.getId = function() {
  if (this.area) {
    return /** @type {!string} */ (this.area.getId());
  }

  return os.ui.query.AreaNode.base(this, 'getId');
};


/**
 * @inheritDoc
 */
os.ui.query.AreaNode.prototype.getLabel = function() {
  if (this.area) {
    return /** @type {!string} */ (this.area.get('title')) || '';
  }

  return os.ui.query.AreaNode.base(this, 'getLabel');
};


/**
 * @inheritDoc
 */
os.ui.query.AreaNode.prototype.getSearchText = function() {
  var t = '';

  if (this.area) {
    t += this.area.get('title') || '';
    t += ' ' + (this.area.get('description') || '');
    t += ' ' + (this.area.get('tags') || '');
  }

  return t;
};


/**
 * @inheritDoc
 */
os.ui.query.AreaNode.prototype.getTags = function() {
  if (this.area) {
    var tags = /** @type {string} */ (this.area.get('tags'));

    if (tags) {
      return os.tag.tagsFromString(tags);
    }
  }

  return null;
};


/**
 * @inheritDoc
 */
os.ui.query.AreaNode.prototype.onMouseEnter = function() {
  var map = os.ui.areaManager.getMap();

  if (map) {
    this.area.setStyle(os.style.area.HOVER_STYLE);
    os.ui.areaManager.getMap().addFeature(this.area);
  }
};


/**
 * @inheritDoc
 */
os.ui.query.AreaNode.prototype.onMouseLeave = function() {
  var map = os.ui.areaManager.getMap();

  if (map) {
    os.ui.areaManager.getMap().removeFeature(this.area);
  }
};


/**
 * Whether or not the layer is loading
 * @return {boolean}
 * @export
 */
os.ui.query.AreaNode.prototype.isLoading = function() {
  return false;
};


/**
 * @inheritDoc
 */
os.ui.query.AreaNode.prototype.updateFrom = function(other) {
  this.setArea(other.getArea());
  os.ui.query.AreaNode.base(this, 'updateFrom', other);
};
