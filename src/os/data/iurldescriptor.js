goog.provide('os.data.IUrlDescriptor');



/**
 * @interface
 */
os.data.IUrlDescriptor = function() {};


/**
 * Identifier for os.implements.
 * @type {string}
 * @const
 */
os.data.IUrlDescriptor.ID = 'os.data.IUrlDescriptor';


/**
 * Get the URL for the descriptor.
 * @return {?string}
 */
os.data.IUrlDescriptor.prototype.getUrl;


/**
 * Set the URL for the descriptor.
 * @param {?string} value
 */
os.data.IUrlDescriptor.prototype.setUrl;
