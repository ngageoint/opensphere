goog.module('os.ui.data.DescriptorProvider');

const CommandProcessor = goog.require('os.command.CommandProcessor');
const ActivateDescriptor = goog.require('os.data.ActivateDescriptor');
const DataManager = goog.require('os.data.DataManager');
const DataProviderEvent = goog.require('os.data.DataProviderEvent');
const DataProviderEventType = goog.require('os.data.DataProviderEventType');
const TriState = goog.require('os.structs.TriState');
const BaseProvider = goog.require('os.ui.data.BaseProvider');
const DescriptorNode = goog.require('os.ui.data.DescriptorNode');

const Promise = goog.requireType('goog.Promise');


/**
 * Generic descriptor-based provider
 *
 * @abstract
 * @template T
 */
class DescriptorProvider extends BaseProvider {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * Adds a descriptor to the provider.
   *
   * @param {T} descriptor
   * @param {boolean=} opt_enable If the descriptor should be activated.
   * @param {boolean=} opt_dedup Whether to check if the descriptor already exists.
   * @template T
   */
  addDescriptor(descriptor, opt_enable, opt_dedup) {
    var dedup = opt_dedup != null ? opt_dedup : true;
    var node = dedup ? this.findNode(descriptor) : null;
    if (!node) {
      node = new DescriptorNode();
      node.setDescriptor(descriptor);
      this.addChild(node);
    }

    var enable = opt_enable != null ? opt_enable : true;
    if (enable) {
      // refresh the descriptor. don't create a command if the descriptor was previously active since the final state
      // isn't changing.
      var wasActive = descriptor.isActive();
      descriptor.setActive(false);

      var cmd = new ActivateDescriptor(descriptor);
      if (wasActive) {
        cmd.execute();
      } else {
        CommandProcessor.getInstance().addCommand(cmd);
      }
    }
  }

  /**
   * Remove the descriptor from the provider.
   *
   * @param {T} descriptor The descriptor
   * @param {boolean=} opt_clear If data should be cleared on the descriptor
   * @template T
   * @return {Promise|undefined} This function can return a promise if it is asynchronous.
   */
  removeDescriptor(descriptor, opt_clear) {
    var node = this.findNode(descriptor);
    if (node) {
      this.removeChild(node);
    }

    descriptor.setActive(false);

    if (opt_clear) {
      descriptor.clearData();
    }

    return undefined;
  }

  /**
   * Get the descriptors registered to this provider.
   *
   * @return {!Array<T>} The descriptors
   */
  getDescriptors() {
    var dm = DataManager.getInstance();
    return dm.getDescriptors(this.getId() + BaseProvider.ID_DELIMITER);
  }

  /**
   * @param {T} descriptor
   * @return {?DescriptorNode}
   * @template T
   */
  findNode(descriptor) {
    var node = null;
    var children = this.getChildren();
    if (children && children.length > 0) {
      var i = children.length;
      while (i--) {
        var child = /** @type {DescriptorNode} */ (children[i]);
        if (child.getDescriptor() == descriptor || child.getDescriptor().getId() == descriptor.getId()) {
          node = child;
          break;
        }
      }
    }

    return node;
  }

  /**
   * @inheritDoc
   */
  configure(config) {
    super.configure(config);
    this.setState(TriState.OFF);
    this.setEditable(false);
    this.setEnabled(true);
  }

  /**
   * @inheritDoc
   */
  load(opt_ping) {
    this.setChildren(null);

    var descriptors = this.getDescriptors();
    for (var i = 0, n = descriptors.length; i < n; i++) {
      var descriptor = descriptors[i];
      this.addDescriptor(descriptor, false, false);
    }

    this.dispatchEvent(new DataProviderEvent(DataProviderEventType.LOADED, this));
  }
}

exports = DescriptorProvider;
