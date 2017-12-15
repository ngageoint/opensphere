goog.provide('os.file.IFileMethod');
goog.require('goog.disposable.IDisposable');
goog.require('goog.events.Listenable');
goog.require('os.file.File');



/**
 * @extends {goog.disposable.IDisposable}
 * @extends {goog.events.Listenable}
 * @interface
 */
os.file.IFileMethod = function() {};


/**
 * Gets the priority of this method. The higher the priority, the earlier the method is tried.
 * @return {number}
 */
os.file.IFileMethod.prototype.getPriority;


/**
 * Detects whether or not this method is supported and returns the result.
 * @return {boolean}
 */
os.file.IFileMethod.prototype.isSupported;


/**
 * The resulting file.
 * @return {os.file.File}
 */
os.file.IFileMethod.prototype.getFile;


/**
 * Associate a file with this method.
 * @param {os.file.File} file
 */
os.file.IFileMethod.prototype.setFile;


/**
 * Launch whatever is needed to load the file. When finished, fire {@type os.events.EventType.COMPLETE}.
 * If canceled, fire {@type os.events.EventType.CANCEL}.
 * @param {Object=} opt_options Additional options for the import manager
 */
os.file.IFileMethod.prototype.loadFile;


/**
 * Clears the file since we are done with the reference
 */
os.file.IFileMethod.prototype.clearFile;


/**
 * Clones the method
 * @return {os.file.IFileMethod} A copy of the method
 */
os.file.IFileMethod.prototype.clone;
