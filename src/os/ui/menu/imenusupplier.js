goog.module('os.ui.menu.IMenuSupplier');

const Menu = goog.requireType('os.ui.menu.Menu');


/**
 * Interface for classes that provide their own context menu
 *
 * @interface
 */
class IMenuSupplier {
  /**
   * Get the context menu.
   * @return {Menu|undefined} The menu.
   */
  getMenu() {}
}

/**
 * Interface identifier.
 * @see `os.implements`
 * @type {string}
 * @const
 */
IMenuSupplier.ID = 'os.ui.menu.IMenuSupplier';

exports = IMenuSupplier;
