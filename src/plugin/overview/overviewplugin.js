goog.provide('plugin.overview.OverviewPlugin');

goog.require('os.plugin.AbstractPlugin');
goog.require('plugin.basemap');
goog.require('plugin.overview.OverviewMap');



/**
 * Adds an overview map to the map controls that syncs with the current base maps
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.overview.OverviewPlugin = function() {
  plugin.overview.OverviewPlugin.base(this, 'constructor');
  this.id = 'overview';

  /**
   * @type {?plugin.overview.OverviewMap}
   * @protected
   */
  this.control = null;
};
goog.inherits(plugin.overview.OverviewPlugin, os.plugin.AbstractPlugin);


/**
 * @inheritDoc
 */
plugin.overview.OverviewPlugin.prototype.init = function() {
  // add the overview map control
  var collapsed = /** @type {boolean} */ (os.settings.get(plugin.overview.OverviewMap.SHOW_KEY, false));

  this.control = new plugin.overview.OverviewMap({
    collapsed: collapsed,
    label: '\u00AB',
    collapseLabel: '\u00BB',
    layers: [
      // just grab the base map group
      os.MapContainer.getInstance().getMap().getLayers().getArray()[0]
    ]});

  os.MapContainer.getInstance().getMap().getControls().push(this.control);
};
