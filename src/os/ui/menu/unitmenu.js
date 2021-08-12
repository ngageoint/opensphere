goog.module('os.ui.menu.unit');
goog.module.declareLegacyNamespace();

const googDispose = goog.require('goog.dispose');
const {Map: MapKeys} = goog.require('os.metrics.keys');
const Menu = goog.require('os.ui.menu.Menu');
const MenuItem = goog.require('os.ui.menu.MenuItem');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');
const UnitManager = goog.require('os.unit.UnitManager');

const ActionEvent = goog.requireType('os.ui.action.ActionEvent');


/**
 * @type {Menu<undefined>|undefined}
 */
let MENU = new Menu(new MenuItem({
  type: MenuItemType.ROOT,
  children: []
}));

/**
 * Set up the menu
 */
const setup = function() {
  var menu = MENU;
  if (menu) {
    var root = menu.getRoot();
    var um = UnitManager.getInstance();
    var systems = um.getFullSystems();
    var curSystem = um.getSelectedSystem();

    var topIdx = 0;
    var bottomIdx = 100;

    for (var system in systems) {
      var sys = systems[system]['distance'];
      if (sys) {
        var eventType = sys.getSystem();
        var label = sys.getTitle();
        var sort = label.indexOf('Only') > -1 ? bottomIdx++ : topIdx++;
        var icon = eventType == curSystem ? 'fa-check-circle-o' : 'fa-circle-o';

        root.addChild({
          eventType: eventType,
          label: label,
          tooltip: 'Switches to ' + label,
          icons: ['<i class="fa fa-fw ' + icon + '"></i>'],
          sort: sort,
          metricKey: MapKeys['UNITS_' + eventType.toUpperCase()],
          beforeRender: updateIcons
        });

        menu.listen(eventType, toggleUnit);
      }
    }

    if (bottomIdx > 100) {
      root.addChild({
        type: MenuItemType.SEPARATOR,
        sort: 99
      });
    }
  }
};

/**
 * Dispose unit actions.
 */
const dispose = function() {
  googDispose(MENU);

  MENU = undefined;
};

/**
 * Toggle active unit system.
 *
 * @param {ActionEvent} event
 */
const toggleUnit = function(event) {
  UnitManager.getInstance().setSelectedSystem(event.type);
};

/**
 * Helper function for changing icons.
 *
 * @this {MenuItem}
 */
const updateIcons = function() {
  var curSystem = UnitManager.getInstance().getSelectedSystem();
  if (this.eventType === curSystem) {
    this.icons = ['<i class="fa fa-fw fa-check-circle-o"></i>'];
  } else {
    this.icons = ['<i class="fa fa-fw fa-circle-o"></i>'];
  }
};

exports = {
  MENU,
  setup,
  dispose,
  toggleUnit,
  updateIcons
};
