goog.declareModuleId('os.ui.ol.interaction.ContextMenuOptions');

const {default: Menu} = goog.requireType('os.ui.menu.Menu');


/**
 * @typedef {{
 *   condition: (function(MapBrowserEvent):boolean|undefined),
 *   featureMenu: (Menu|undefined),
 *   mapMenu: (Menu<ol.Coordinate>|undefined)
 * }}
 */
let ContextMenuOptions;

export default ContextMenuOptions;
