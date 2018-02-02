goog.provide('plugin.position.PositionPlugin');

goog.require('os.map');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.action.Action');
goog.require('os.ui.action.MenuOptions');
goog.require('os.ui.menu.map');
goog.require('plugin.position.PositionInteraction');
goog.require('plugin.position.copyPositionDirective');



/**
 * Provides map layer support
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.position.PositionPlugin = function() {
  plugin.position.PositionPlugin.base(this, 'constructor');
  this.id = plugin.position.PositionPlugin.ID;
};
goog.inherits(plugin.position.PositionPlugin, os.plugin.AbstractPlugin);
goog.addSingletonGetter(plugin.position.PositionPlugin);


/**
 * @type {string}
 * @const
 */
plugin.position.PositionPlugin.ID = 'position';


/**
 * @inheritDoc
 */
plugin.position.PositionPlugin.prototype.init = function() {
  if (os.ui.menu.MAP) {
    var menu = os.ui.menu.MAP;

    var group = menu.getRoot().find('Coordinate');
    if (group) {
      group.addChild({
        label: 'Copy Coordinates',
        eventType: os.action.EventType.COPY,
        tooltip: 'Copy coordinates to clipboard',
        icons: ['<i class="fa fa-fw fa-sticky-note"></i>'],
        shortcut: '.',
        metricKey: os.metrics.keys.Map.COPY_COORDINATES_CONTEXT_MENU
      });
    }

    menu.listen(os.action.EventType.COPY, plugin.position.onCopy_);
  }

  os.MapContainer.getInstance().getMap().getInteractions().push(new plugin.position.PositionInteraction());
};


/**
 * @param {os.ui.menu.MenuEvent} evt The menu event
 */
plugin.position.onCopy_ = function(evt) {
  plugin.position.launchCopy(/** @type {ol.Coordinate} */ (evt.getContext()));
};


/**
 * @param {ol.Coordinate=} opt_coord The coordinate
 */
plugin.position.launchCopy = function(opt_coord) {
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.COPY_COORDINATES, 1);
  var controls = os.MapContainer.getInstance().getMap().getControls().getArray();
  var mousePos = null;
  for (var i = 0, n = controls.length; i < n; i++) {
    if (controls[i] instanceof os.ol.control.MousePosition) {
      mousePos = /** @type {os.ol.control.MousePosition} */ (controls[i]);
      break;
    }
  }

  if (mousePos) {
    var positionString = mousePos.getPositionString(opt_coord);
    if (positionString) {
      positionString = positionString.replace('+', '').replace('+', '');
      plugin.position.CopyPositionCtrl.launch(positionString);
    }
  }
};
