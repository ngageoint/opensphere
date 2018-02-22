goog.provide('plugin.suncalc.Plugin');

goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.menu.map');
goog.require('plugin.suncalc.lightStripDirective');
goog.require('plugin.suncalc.sunCalcDirective');


/**
 *
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.suncalc.Plugin = function() {
  plugin.suncalc.Plugin.base(this, 'constructor');
  this.id = plugin.suncalc.ID;
};
goog.inherits(plugin.suncalc.Plugin, os.plugin.AbstractPlugin);
goog.addSingletonGetter(plugin.suncalc.Plugin);


/**
 * @type {string}
 * @const
 */
plugin.suncalc.ID = 'suncalc';


/**
 * @inheritDoc
 */
plugin.suncalc.Plugin.prototype.init = function() {
  var menu = os.ui.menu.MAP;
  if (menu) {
    var group = menu.getRoot().find('Coordinate');

    if (group) {
      group.addChild({
        label: 'Sun/Moon Info',
        eventType: plugin.suncalc.ID,
        tooltip: 'See sun/moon event times for this location',
        icons: ['<i class="fa fa-fw fa-sun-o"></i>']
      });

      menu.listen(plugin.suncalc.ID, plugin.suncalc.onMenuItem_);
    }

    group = menu.getRoot().find('Options');
    if (group) {
      group.addChild({
        label: 'Sunlight',
        eventType: os.config.DisplaySetting.ENABLE_LIGHTING,
        type: os.ui.menu.MenuItemType.CHECK,
        tooltip: 'Light the 3D globe with the Sun'
      });

      var x = group.find(os.config.DisplaySetting.ENABLE_LIGHTING);
      if (x) {
        /**
         * @this {os.ui.menu.MenuItem}
         */
        x.beforeRender = function() {
          this.visible = os.MapContainer.getInstance().is3DEnabled();
          this.selected = !!os.settings.get(os.config.DisplaySetting.ENABLE_LIGHTING, false);
        };

        x.handler = plugin.suncalc.onEnableLighting;
      }
    }
  }
};


/**
 * Enable lighting menu option listener
 * @param {os.ui.menu.MenuEvent<ol.Coordinate>} evt The event
 * @this {os.ui.menu.MenuItem}
 */
plugin.suncalc.onEnableLighting = function(evt) {
  plugin.suncalc.setLightingEnabled(!this.selected);
};


/**
 * @param {boolean} value The value
 */
plugin.suncalc.setLightingEnabled = function(value) {
  os.settings.set(os.config.DisplaySetting.ENABLE_LIGHTING, value);

  var mc = os.MapContainer.getInstance();
  if (mc.is3DEnabled()) {
    mc.getOLCesium().getCesiumScene().globe.enableLighting = value;
    os.dispatcher.dispatchEvent(os.olcs.RenderLoop.REPAINT);
  }
};


/**
 * Suncalc menu option listener
 * @param {os.ui.menu.MenuEvent<ol.Coordinate>} evt The menu event
 * @private
 */
plugin.suncalc.onMenuItem_ = function(evt) {
  plugin.suncalc.launch(evt.getContext());
};


/**
 * Opens a sun calc window for the given location
 * @param {ol.Coordinate} coord
 */
plugin.suncalc.launch = function(coord) {
  var scopeOptions = {
    'coord': coord
  };

  var windowOptions = {
    'id': plugin.suncalc.ID,
    'label': 'Sun and Moon Info',
    'icon': 'fa fa-sun-o orange-icon',
    'x': 'center',
    'y': 'center',
    'width': 400,
    'min-width': 400,
    'max-width': 0,
    'height': 400,
    'min-height': 300,
    'max-height': 0,
    'show-close': true
  };

  var template = '<suncalc></suncalc>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
