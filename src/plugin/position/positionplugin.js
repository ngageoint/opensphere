goog.module('plugin.position.PositionPlugin');
goog.module.declareLegacyNamespace();

const MapContainer = goog.require('os.MapContainer');
const EventType = goog.require('os.action.EventType');
const keys = goog.require('os.metrics.keys');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const mapMenu = goog.require('os.ui.menu.map');
const PositionInteraction = goog.require('plugin.position.PositionInteraction');
const {launchCopy} = goog.require('plugin.position.CopyPositionUI');


/**
 * Plugin identifier.
 * @type {string}
 */
const ID = 'position';


/**
 * Provides map layer support
 */
class PositionPlugin extends AbstractPlugin {
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
    if (mapMenu.MENU) {
      var menu = mapMenu.MENU;

      var group = menu.getRoot().find(mapMenu.GroupLabel.COORDINATE);
      if (group) {
        group.addChild({
          label: 'Copy Coordinates',
          eventType: EventType.COPY,
          tooltip: 'Copy coordinates to clipboard',
          icons: ['<i class="fa fa-fw fa-sticky-note"></i>'],
          shortcut: '.',
          metricKey: keys.Map.COPY_COORDINATES_CONTEXT_MENU
        });
      }

      menu.listen(EventType.COPY, onCopy);
    }

    MapContainer.getInstance().getMap().getInteractions().push(new PositionInteraction());
  }

  /**
   * Get the global alert instance.
   * @return {!PositionPlugin}
   */
  static getInstance() {
    if (!instance) {
      instance = new PositionPlugin();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {PositionPlugin} value The instance.
   */
  static setInstance(value) {
    instance = value;
  }
}


/**
 * The global instance.
 * @type {PositionPlugin}
 */
let instance = null;


/**
 * @param {os.ui.menu.MenuEvent} evt The menu event
 */
const onCopy = function(evt) {
  launchCopy(/** @type {ol.Coordinate} */ (evt.getContext()));
};

exports = PositionPlugin;
