goog.declareModuleId('os.ui.menu.unit');

import {Map as MapKeys} from '../../metrics/metricskeys.js';
import UnitManager from '../../unit/unitmanager.js';
import Menu from './menu.js';
import MenuItem from './menuitem.js';
import MenuItemType from './menuitemtype.js';

const googDispose = goog.require('goog.dispose');

const {default: ActionEvent} = goog.requireType('os.ui.action.ActionEvent');


/**
 * @type {Menu<undefined>|undefined}
 */
export let MENU = new Menu(new MenuItem({
  type: MenuItemType.ROOT,
  children: []
}));

/**
 * Set up the menu
 */
export const setup = function() {
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
export const dispose = function() {
  googDispose(MENU);

  MENU = undefined;
};

/**
 * Toggle active unit system.
 *
 * @param {ActionEvent} event
 */
export const toggleUnit = function(event) {
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
