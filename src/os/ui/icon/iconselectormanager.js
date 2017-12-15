goog.provide('os.ui.icon.IconSelectorManager');
goog.require('os.data.CollectionManager');



/**
 * IconSelectorManager manages all of the selectors used for picking icons
 * @extends {os.data.CollectionManager<osx.icon.iconSelector>}
 * @constructor
 */
os.ui.icon.IconSelectorManager = function() {
  os.ui.icon.IconSelectorManager.base(this, 'constructor');
  this.add({ // default icon selector
    'id': 'google_icons',
    'name': 'Google Icons',
    'html': '<iconpalette accept-callback="acceptCallback" selected="selected" icon-set="iconSet" ' +
        'icon-src="iconSrc"></iconpalette>'
  });
};
goog.inherits(os.ui.icon.IconSelectorManager, os.data.CollectionManager);
goog.addSingletonGetter(os.ui.icon.IconSelectorManager);
