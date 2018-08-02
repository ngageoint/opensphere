goog.provide('os.data.IServerDescriptor');



/**
 * Interface for descriptors loaded from a server.
 * @interface
 */
os.data.IServerDescriptor = function() {};


/**
 * Mark the descriptor as updated.
 */
os.data.IServerDescriptor.prototype.updatedFromServer;
