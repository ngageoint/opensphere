goog.provide('os.ui.menu.IMenuSupplier');


/**
 * Interface for classes that provide their own context menu
 * @interface
 */
os.ui.menu.IMenuSupplier = function() {};


/**
 * Interface identifier.
 * @see `os.implements`
 * @type {string}
 * @const
 */
os.ui.menu.IMenuSupplier.ID = 'os.ui.menu.IMenuSupplier';


/**
 * Get the context menu.
 * @return {os.ui.menu.Menu|undefined} The menu.
 */
os.ui.menu.IMenuSupplier.prototype.getMenu = goog.abstractMethod;
