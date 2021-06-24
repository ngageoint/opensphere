goog.module('os.data.IUrlDescriptor');
goog.module.declareLegacyNamespace();


/**
 * @interface
 */
class IUrlDescriptor {
  /**
   * Get the URL for the descriptor.
   * @return {?string}
   */
  getUrl() {}

  /**
   * Set the URL for the descriptor.
   * @param {?string} value
   */
  setUrl(value) {}
}


/**
 * Identifier for os.implements.
 * @type {string}
 * @const
 */
IUrlDescriptor.ID = 'os.data.IUrlDescriptor';


exports = IUrlDescriptor;
