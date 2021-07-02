goog.module('os.ui.icon.IconSelectorManager');
goog.module.declareLegacyNamespace();

const CollectionManager = goog.require('os.data.CollectionManager');


/**
 * IconSelectorManager manages all of the selectors used for picking icons
 *
 * @extends {CollectionManager<osx.icon.iconSelector>}
 */
class IconSelectorManager extends CollectionManager {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.add({
      // default icon selector
      'id': 'google_icons',
      'name': 'Google Icons',
      'html': '<iconpalette accept-callback="acceptCallback" selected="selected" icon-set="iconSet" ' +
          'icon-src="iconSrc"></iconpalette>'
    });
  }

  /**
   * Get the global instance.
   * @return {!IconSelectorManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new IconSelectorManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {IconSelectorManager} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {IconSelectorManager|undefined}
 */
let instance;

exports = IconSelectorManager;
