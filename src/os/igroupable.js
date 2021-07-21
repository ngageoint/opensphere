goog.module('os.IGroupable');
goog.module.declareLegacyNamespace();

/**
 * Interface representing a thing that supports advanced grouping options.
 * @interface
 */
class IGroupable {
  /**
   * Gets the group ID.
   * @return {!string} The ID
   */
  getGroupId() {}

  /**
   * Gets the group label.
   * @return {!string} The label
   */
  getGroupLabel() {}
}

/**
 * ID for {@see os.implements}
 * @const {string}
 */
IGroupable.ID = 'os.IGroupable';

exports = IGroupable;
