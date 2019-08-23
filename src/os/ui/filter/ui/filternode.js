goog.provide('os.ui.filter.ui.FilterNode');

goog.require('goog.events.EventType');
goog.require('os.data.ISearchable');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.filter.default');
goog.require('os.structs.TriState');
goog.require('os.ui.filter.PropertyChange');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Tree nodes for filters
 *
 * @param {os.filter.FilterEntry=} opt_entry
 * @extends {os.ui.slick.SlickTreeNode}
 * @implements {os.data.ISearchable}
 * @constructor
 */
os.ui.filter.ui.FilterNode = function(opt_entry) {
  os.ui.filter.ui.FilterNode.base(this, 'constructor');

  /**
   * The icon to display for default filters.
   * @type {string}
   * @protected
   */
  this.defaultIcon = os.filter.default.ICON;

  /**
   * @type {?os.filter.FilterEntry}
   * @protected
   */
  this.entry = null;
  if (opt_entry) {
    this.setEntry(opt_entry);
  }
  this.nodeUI = '<filternodeui></filternodeui>';
};
goog.inherits(os.ui.filter.ui.FilterNode, os.ui.slick.SlickTreeNode);


/**
 * @inheritDoc
 */
os.ui.filter.ui.FilterNode.prototype.setState = function(value) {
  var old = this.getState();
  os.ui.filter.ui.FilterNode.superClass_.setState.call(this, value);
  var s = this.getState();

  if (old != s && this.entry) {
    var enabled = s === os.structs.TriState.ON;

    if (s !== os.structs.TriState.BOTH && this.entry.isEnabled() !== enabled) {
      this.entry.setEnabled(enabled);
    }
  }
};


/**
 * @return {?os.filter.FilterEntry}
 */
os.ui.filter.ui.FilterNode.prototype.getEntry = function() {
  return this.entry;
};


/**
 * @param {?os.filter.FilterEntry} value
 */
os.ui.filter.ui.FilterNode.prototype.setEntry = function(value) {
  if (value !== this.entry) {
    if (this.entry) {
      this.entry.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onPropertyChange, false, this);
    }

    var old = this.entry;
    this.entry = value;

    if (this.entry) {
      this.entry.listen(goog.events.EventType.PROPERTYCHANGE, this.onPropertyChange, false, this);
      this.setId(this.entry.getId());
      this.setLabel(this.entry.getTitle());
      this.setState(this.entry.isEnabled() ? os.structs.TriState.ON : os.structs.TriState.OFF);
    }

    this.setToolTip(this.generateToolTip());
    this.dispatchEvent(new os.events.PropertyChangeEvent('filter', value, old));
  }
};


/**
 * @inheritDoc
 */
os.ui.filter.ui.FilterNode.prototype.disposeInternal = function() {
  if (this.entry) {
    this.entry.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onPropertyChange, false, this);
    this.entry = null;
  }

  os.ui.filter.ui.FilterNode.superClass_.disposeInternal.call(this);
};


/**
 * @inheritDoc
 */
os.ui.filter.ui.FilterNode.prototype.getId = function() {
  if (this.entry) {
    return this.entry.getId();
  }

  return os.ui.filter.ui.FilterNode.superClass_.getId.call(this);
};


/**
 * @inheritDoc
 */
os.ui.filter.ui.FilterNode.prototype.getLabel = function() {
  if (this.entry) {
    return this.entry.getTitle();
  }

  return os.ui.filter.ui.FilterNode.superClass_.getLabel.call(this);
};


/**
 * @inheritDoc
 */
os.ui.filter.ui.FilterNode.prototype.getSearchText = function() {
  var t = '';

  if (this.entry) {
    t += this.entry.getTitle();
    t += ' ' + this.entry.getDescription();
    t += ' ' + this.entry.type;
    t += ' ' + this.entry.getTags();
  }

  return t;
};


/**
 * @inheritDoc
 */
os.ui.filter.ui.FilterNode.prototype.getTags = function() {
  return this.entry ? os.tag.tagsFromString(this.entry.getTags()) : null;
};


/**
 * @inheritDoc
 */
os.ui.filter.ui.FilterNode.prototype.formatIcons = function() {
  var icons = os.ui.filter.ui.FilterNode.base(this, 'formatIcons');

  if (this.entry && this.entry.isDefault()) {
    icons += this.defaultIcon;
  }

  return icons;
};


/**
 * Generate a tooltip to display when the node is hovered.
 *
 * @return {string} The new tooltip.
 * @protected
 */
os.ui.filter.ui.FilterNode.prototype.generateToolTip = function() {
  var tooltip = '';

  if (this.entry) {
    tooltip += 'Description: ' + (this.entry.getDescription() || 'None provided.');
    tooltip += '\nFilter: ' + os.ui.filter.toFilterString(this.entry.getFilterNode(), 1000);
  }

  return tooltip;
};


/**
 * @inheritDoc
 */
os.ui.filter.ui.FilterNode.prototype.updateFrom = function(other) {
  os.ui.filter.ui.FilterNode.superClass_.updateFrom.call(this, other);
  this.setEntry(/** @type {os.ui.filter.ui.FilterNode} */ (other).getEntry());
};


/**
 * @param {os.events.PropertyChangeEvent} event
 * @protected
 */
os.ui.filter.ui.FilterNode.prototype.onPropertyChange = function(event) {
  var prop = event.getProperty();

  if (prop == os.ui.filter.PropertyChange.ENABLED) {
    this.setState(this.entry.isEnabled() ? os.structs.TriState.ON : os.structs.TriState.OFF);
  }
};
