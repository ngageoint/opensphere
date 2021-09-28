goog.declareModuleId('os.IGroupable');

/**
 * Interface representing a thing that supports advanced grouping options.
 * @interface
 */
export default class IGroupable {
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
