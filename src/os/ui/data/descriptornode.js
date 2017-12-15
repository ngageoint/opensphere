goog.provide('os.ui.data.DescriptorNode');

goog.require('goog.events.EventType');
goog.require('os.command.CommandProcessor');
goog.require('os.data.ActivateDescriptor');
goog.require('os.data.DeactivateDescriptor');
goog.require('os.data.ISearchable');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.structs.TriState');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Displays a data descriptor in a tree node
 * @implements {os.data.ISearchable}
 * @extends {os.ui.slick.SlickTreeNode}
 * @constructor
 */
os.ui.data.DescriptorNode = function() {
  os.ui.data.DescriptorNode.base(this, 'constructor');

  /**
   * @type {?os.data.IDataDescriptor}
   * @private
   */
  this.descriptor_ = null;
};
goog.inherits(os.ui.data.DescriptorNode, os.ui.slick.SlickTreeNode);


/**
 * @inheritDoc
 */
os.ui.data.DescriptorNode.prototype.setState = function(value) {
  var old = this.getState();
  os.ui.data.DescriptorNode.superClass_.setState.call(this, value);
  var s = this.getState();

  if (old != s && this.descriptor_) {
    var active = s === os.structs.TriState.ON;
    if (active !== this.descriptor_.isActive()) {
      var cmd = active ? new os.data.ActivateDescriptor(this.descriptor_) :
          new os.data.DeactivateDescriptor(this.descriptor_);

      if (!os.commandStack.addCommand(cmd)) {
        os.ui.data.DescriptorNode.superClass_.setState.call(this, os.structs.TriState.OFF);
      }
    }
  }
};


/**
 * Gets the data descriptor
 * @return {?os.data.IDataDescriptor} The descriptor
 */
os.ui.data.DescriptorNode.prototype.getDescriptor = function() {
  return this.descriptor_;
};


/**
 * Sets the data descriptor
 * @param {!os.data.IDataDescriptor} value The descriptor
 */
os.ui.data.DescriptorNode.prototype.setDescriptor = function(value) {
  if (value !== this.descriptor_) {
    if (this.descriptor_) {
      this.descriptor_.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onPropertyChange_, false, this);
    }

    var old = this.descriptor_;
    this.descriptor_ = value;

    this.descriptor_.listen(goog.events.EventType.PROPERTYCHANGE, this.onPropertyChange_, false, this);
    this.setId(this.descriptor_.getId());
    this.setLabel(this.descriptor_.getTitle());
    this.setToolTip(this.descriptor_.getDescription() || '');
    this.nodeUI = this.descriptor_.getNodeUI();

    this.setState(this.descriptor_.isActive() ? os.structs.TriState.ON : os.structs.TriState.OFF);
    this.dispatchEvent(new os.events.PropertyChangeEvent('descriptor', value, old));
  }
};


/**
 * @inheritDoc
 */
os.ui.data.DescriptorNode.prototype.disposeInternal = function() {
  if (this.descriptor_) {
    this.descriptor_.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onPropertyChange_, false, this);
  }

  os.ui.data.DescriptorNode.superClass_.disposeInternal.call(this);
};


/**
 * @inheritDoc
 */
os.ui.data.DescriptorNode.prototype.getId = function() {
  if (this.descriptor_) {
    return this.descriptor_.getId();
  }

  return os.ui.data.DescriptorNode.superClass_.getId.call(this);
};


/**
 * @inheritDoc
 */
os.ui.data.DescriptorNode.prototype.getLabel = function() {
  if (this.descriptor_) {
    // var explicitTitle = this.descriptor_.getExplicitTitle() || '';
    return this.descriptor_.getTitle(); // + (explicitTitle ? ' ' + explicitTitle : '');
  }

  return os.ui.data.DescriptorNode.superClass_.getId.call(this);
};


/**
 * @inheritDoc
 */
os.ui.data.DescriptorNode.prototype.getSearchText = function() {
  return this.descriptor_ ? this.descriptor_.getSearchText() : '';
};


/**
 * @inheritDoc
 */
os.ui.data.DescriptorNode.prototype.getTags = function() {
  return this.descriptor_ ? this.descriptor_.getTags() : [];
};


/**
 * @inheritDoc
 */
os.ui.data.DescriptorNode.prototype.formatIcons = function() {
  var s = null;

  if (this.descriptor_) {
    s = this.descriptor_.getIcons();
  }

  if (!s) {
    return os.ui.data.DescriptorNode.superClass_.formatIcons.call(this);
  }

  return s;
};


/**
 * Whether or not the descriptor (or the items the descriptor has added) is loading
 * @return {boolean}
 */
os.ui.data.DescriptorNode.prototype.isLoading = function() {
  if (this.descriptor_) {
    return this.descriptor_.isLoading();
  }

  return false;
};
goog.exportProperty(
    os.ui.data.DescriptorNode.prototype,
    'isLoading',
    os.ui.data.DescriptorNode.prototype.isLoading);


/**
 * Handles changes on the desriptor
 * @param {os.events.PropertyChangeEvent} e The event
 * @private
 */
os.ui.data.DescriptorNode.prototype.onPropertyChange_ = function(e) {
  var p = e.getProperty();

  if (p == 'active') {
    this.setState(this.descriptor_.isActive() ? os.structs.TriState.ON : os.structs.TriState.OFF);
  } else if (p == 'loading') {
    this.dispatchEvent(new os.events.PropertyChangeEvent('loading', e.getOldValue(), e.getNewValue()));
  } else if (p == 'icons') {
    this.dispatchEvent(new os.events.PropertyChangeEvent(p));
  } else if (p == 'title' || p == 'explicitTitle') {
    this.setLabel(this.descriptor_.getTitle());
    this.dispatchEvent(new os.events.PropertyChangeEvent('label'));
  }
};


/**
 * @inheritDoc
 */
os.ui.data.DescriptorNode.prototype.updateFrom = function(other) {
  this.setDescriptor(other.getDescriptor());
  os.ui.data.DescriptorNode.superClass_.updateFrom.call(this, other);
};
