goog.module('os.ui.ol.interaction.ContextMenuOptions');
goog.module.declareLegacyNamespace();

const MapBrowserEvent = goog.requireType('ol.MapBrowserEvent');
const Menu = goog.requireType('os.ui.menu.Menu');

/**
 * @typedef {{
 *   condition: (function(MapBrowserEvent):boolean|undefined),
 *   featureMenu: (Menu|undefined),
 *   mapMenu: (Menu<ol.Coordinate>|undefined)
 * }}
 */
let ContextMenuOptions;

exports = ContextMenuOptions;
