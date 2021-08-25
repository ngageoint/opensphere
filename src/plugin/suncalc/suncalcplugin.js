goog.module('plugin.suncalc.SunCalcPlugin');
goog.module.declareLegacyNamespace();

goog.require('plugin.suncalc.LightStripUI');

const MapContainer = goog.require('os.MapContainer');
const DisplaySetting = goog.require('os.config.DisplaySetting');
const settings = goog.require('os.config.Settings');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const SettingsManager = goog.require('os.ui.config.SettingsManager');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');
const mapMenu = goog.require('os.ui.menu.map');
const osWindow = goog.require('os.ui.window');
const {ID} = goog.require('plugin.suncalc');
const LightStripSettings = goog.require('plugin.suncalc.LightStripSettings');
const {directiveTag: sunCalcEl} = goog.require('plugin.suncalc.SunCalcUI');

const MenuEvent = goog.requireType('os.ui.menu.MenuEvent');
const MenuItem = goog.requireType('os.ui.menu.MenuItem');


/**
 */
class SunCalcPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    var menu = mapMenu.getMenu();
    if (menu) {
      var group = menu.getRoot().find(mapMenu.GroupLabel.COORDINATE);

      if (group) {
        group.addChild({
          label: 'Sun/Moon Info',
          eventType: ID,
          tooltip: 'See sun/moon event times for this location',
          icons: ['<i class="fa fa-fw fa-sun-o"></i>']
        });

        menu.listen(ID, onMenuItem);
      }

      group = menu.getRoot().find(mapMenu.GroupLabel.OPTIONS);
      if (group) {
        group.addChild({
          label: 'Sunlight',
          eventType: DisplaySetting.ENABLE_LIGHTING,
          type: MenuItemType.CHECK,
          tooltip: 'Light the 3D globe with the Sun',
          handler: onEnableLighting,
          beforeRender: updateSunlightItem
        });
      }
    }

    // register the new settings 'plugin';
    var sm = SettingsManager.getInstance();
    sm.addSettingPlugin(new LightStripSettings());
  }

  /**
   * Get the global alert instance.
   * @return {!SunCalcPlugin}
   */
  static getInstance() {
    if (!instance) {
      instance = new SunCalcPlugin();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {SunCalcPlugin} value The instance.
   */
  static setInstance(value) {
    instance = value;
  }
}


/**
 * The global instance.
 * @type {SunCalcPlugin}
 */
let instance = null;


/**
 * Update the Sunlight menu item.
 *
 * @this {MenuItem}
 */
const updateSunlightItem = function() {
  this.visible = MapContainer.getInstance().is3DEnabled();
  this.selected = !!settings.getInstance().get(DisplaySetting.ENABLE_LIGHTING, false);
};


/**
 * Enable lighting menu option listener
 *
 * @param {MenuEvent<ol.Coordinate>} evt The event
 * @this {MenuItem}
 */
const onEnableLighting = function(evt) {
  settings.getInstance().set(DisplaySetting.ENABLE_LIGHTING, !this.selected);
};


/**
 * Suncalc menu option listener
 *
 * @param {MenuEvent<ol.Coordinate>} evt The menu event
 */
const onMenuItem = function(evt) {
  launchWindow(evt.getContext());
};


/**
 * Opens a sun calc window for the given location
 *
 * @param {ol.Coordinate} coord
 */
const launchWindow = function(coord) {
  var scopeOptions = {
    'coord': coord
  };

  var windowOptions = {
    'id': ID,
    'label': 'Sun and Moon Info',
    'icon': 'fa fa-sun-o',
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

  var template = `<${sunCalcEl}></${sunCalcEl}>`;
  osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};

exports = SunCalcPlugin;
