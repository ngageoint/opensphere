goog.provide('os.data.AreaNode');

goog.require('goog.events.EventType');
goog.require('ol.events');
goog.require('os.command.AreaToggle');
goog.require('os.data.ISearchable');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.feature');
goog.require('os.implements');
goog.require('os.structs.TriState');
goog.require('os.ui.menu.IMenuSupplier');
goog.require('os.ui.node.areaNodeUIDirective');
goog.require('os.ui.query.AreaNode');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Tree nodes for areas
 * @extends {os.ui.query.AreaNode}
 * @implements {os.data.ISearchable}
 * @implements {os.ui.menu.IMenuSupplier}
 * @param {!ol.Feature=} opt_area
 * @constructor
 */
os.data.AreaNode = function(opt_area) {
  os.data.AreaNode.base(this, 'constructor', opt_area);

  var qm = os.ui.queryManager;
  qm.listen(goog.events.EventType.PROPERTYCHANGE, this.onQueriesChanged_, false, this);
};
goog.inherits(os.data.AreaNode, os.ui.query.AreaNode);
os.implements(os.data.AreaNode, os.ui.menu.IMenuSupplier.ID);


/**
 * @inheritDoc
 */
os.data.AreaNode.prototype.disposeInternal = function() {
  os.data.AreaNode.base(this, 'disposeInternal');
  var qm = os.ui.queryManager;
  qm.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onQueriesChanged_, false, this);
};


/**
 * @inheritDoc
 */
os.data.AreaNode.prototype.getMenu = function() {
  return os.ui.menu.SPATIAL;
};


/**
 * @inheritDoc
 */
os.data.AreaNode.prototype.setArea = function(area) {
  if (area !== this.area) {
    if (this.area) {
      ol.events.unlisten(this.area, 'toggle', this.onAreaToggled, this);
    }

    var old = this.area;
    this.area = area;
    this.updateFromArea();

    if (this.area) {
      this.nodeUI = '<areanodeui></areanodeui>';
      ol.events.listen(this.area, 'toggle', this.onAreaToggled, this);
    } else {
      this.nodeUI = '';
    }

    this.dispatchEvent(new os.events.PropertyChangeEvent('area', area, old));
  } else {
    // the area's properties may have changed, so update the node
    this.updateFromArea();
  }
};


/**
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
os.data.AreaNode.prototype.onQueriesChanged_ = function(event) {
  this.dispatchEvent(new os.events.PropertyChangeEvent('icons'));
};


/**
 * @inheritDoc
 */
os.data.AreaNode.prototype.setState = function(value) {
  if (value !== os.structs.TriState.BOTH) {
    var old = this.getState();
    this.setStateInternal(value);
    var s = this.getState();

    if (old != s && this.area) {
      var show = s !== os.structs.TriState.OFF;
      var shown = /** @type {boolean} */ (this.area.get('shown'));

      // we only need to fire a command if the feature differs
      if (show !== shown) {
        var cmd = new os.command.AreaToggle(this.area, show);
        os.command.CommandProcessor.getInstance().addCommand(cmd);
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.data.AreaNode.prototype.onMouseEnter = function() {
  os.ui.areaManager.highlight(this.area);
};


/**
 * @inheritDoc
 */
os.data.AreaNode.prototype.onMouseLeave = function() {
  os.ui.areaManager.unhighlight(this.area);
};


/**
 * @inheritDoc
 */
os.data.AreaNode.prototype.formatIcons = function() {
  var area = this.getArea();
  var result = os.ui.queryManager.hasArea(/** @type {string} */ (area.getId()));

  var icon;
  var tooltip;
  if (result == 1) {
    icon = 'fa-ban red-icon';
    tooltip = 'This area is an exclusion';
  } else if (result == 2) {
    icon = 'fa-circle-o yellow-icon';
    tooltip = 'This area is querying features';
  } else if (result == 3) {
    icon = 'fa-circle-o orange-icon';
    tooltip = 'This area is being used for queries and exclusions';
  } else {
    icon = 'fa-circle-o';
    tooltip = 'This area is being displayed on the map';
  }

  if (icon) {
    return ' <i class="fa ' + icon + '" title="' + tooltip + '"></i> ';
  }

  return os.data.AreaNode.base(this, 'formatIcons');
};
