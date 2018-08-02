goog.provide('os.ui.data.DescriptorProvider');

goog.require('os.data.ActivateDescriptor');
goog.require('os.data.DataProviderEvent');
goog.require('os.data.DataProviderEventType');
goog.require('os.ui.data.BaseProvider');
goog.require('os.ui.data.DescriptorNode');



/**
 * Generic descriptor-based provider
 * @extends {os.ui.data.BaseProvider}
 * @constructor
 * @template T
 */
os.ui.data.DescriptorProvider = function() {
  os.ui.data.DescriptorProvider.base(this, 'constructor');
};
goog.inherits(os.ui.data.DescriptorProvider, os.ui.data.BaseProvider);


/**
 * Adds a descriptor to the provider.
 * @param {T} descriptor
 * @param {boolean=} opt_enable If the descriptor should be activated.
 * @param {boolean=} opt_dedup Whether to check if the descriptor already exists.
 * @template T
 */
os.ui.data.DescriptorProvider.prototype.addDescriptor = function(descriptor, opt_enable, opt_dedup) {
  var dedup = goog.isDefAndNotNull(opt_dedup) ? opt_dedup : true;
  var node = dedup ? this.findNode(descriptor) : null;
  if (!node) {
    node = new os.ui.data.DescriptorNode();
    node.setDescriptor(descriptor);
    this.addChild(node);
  }

  var enable = goog.isDefAndNotNull(opt_enable) ? opt_enable : true;
  if (enable) {
    // refresh the descriptor. don't create a command if the descriptor was previously active since the final state
    // isn't changing.
    var wasActive = descriptor.isActive();
    descriptor.setActive(false);

    var cmd = new os.data.ActivateDescriptor(descriptor);
    if (wasActive) {
      cmd.execute();
    } else {
      os.commandStack.addCommand(cmd);
    }
  }
};


/**
 * Remove the descriptor from the provider.
 * @param {T} descriptor The descriptor
 * @param {boolean=} opt_clear If data should be cleared on the descriptor
 * @template T
 */
os.ui.data.DescriptorProvider.prototype.removeDescriptor = function(descriptor, opt_clear) {
  var node = this.findNode(descriptor);
  if (node) {
    this.removeChild(node);
  }

  descriptor.setActive(false);

  if (opt_clear) {
    descriptor.clearData();
  }
};


/**
 * Get the descriptors registered to this provider.
 * @return {!Array.<T>} The descriptors
 * @protected
 */
os.ui.data.DescriptorProvider.prototype.getDescriptors = function() {
  var dm = os.dataManager;
  return dm.getDescriptors(this.getId() + os.ui.data.BaseProvider.ID_DELIMITER);
};


/**
 * @param {T} descriptor
 * @return {?os.ui.data.DescriptorNode}
 * @template T
 */
os.ui.data.DescriptorProvider.prototype.findNode = function(descriptor) {
  var node = null;
  var children = this.getChildren();
  if (children && children.length > 0) {
    var i = children.length;
    while (i--) {
      var child = /** @type {os.ui.data.DescriptorNode} */ (children[i]);
      if (child.getDescriptor() == descriptor || child.getDescriptor().getId() == descriptor.getId()) {
        node = child;
        break;
      }
    }
  }

  return node;
};


/**
 * @inheritDoc
 */
os.ui.data.DescriptorProvider.prototype.configure = function(config) {
  this.setState(os.structs.TriState.OFF);
  this.setEditable(false);
  this.setEnabled(true);
};


/**
 * @inheritDoc
 */
os.ui.data.DescriptorProvider.prototype.load = function(opt_ping) {
  this.setChildren(null);

  var descriptors = this.getDescriptors();
  for (var i = 0, n = descriptors.length; i < n; i++) {
    var descriptor = descriptors[i];
    this.addDescriptor(descriptor, false, false);
  }

  this.dispatchEvent(new os.data.DataProviderEvent(os.data.DataProviderEventType.LOADED, this));
};
