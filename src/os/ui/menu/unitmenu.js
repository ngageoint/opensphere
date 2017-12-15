goog.provide('os.ui.menu.unit');

goog.require('os.metrics.keys');
goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.MenuItemType');


/**
 * @type {os.ui.menu.Menu<undefined>|undefined}
 */
os.ui.menu.UNIT = new os.ui.menu.Menu(new os.ui.menu.MenuItem({
  type: os.ui.menu.MenuItemType.ROOT,
  children: []
}));


/**
 * Set up the menu
 */
os.ui.menu.unit.setup = function() {
  var menu = os.ui.menu.UNIT;
  if (menu) {
    var root = menu.getRoot();
    var um = os.unit.UnitManager.getInstance();
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
          metricKey: os.metrics.keys.Map['UNITS_' + eventType.toUpperCase()],
          beforeRender: os.ui.menu.unit.updateIcons
        });

        menu.listen(eventType, os.ui.menu.unit.toggleUnit);
      }
    }

    if (bottomIdx > 100) {
      root.addChild({
        type: os.ui.menu.MenuItemType.SEPARATOR,
        sort: 99
      });
    }
  }
};


/**
 * Dispose unit actions.
 */
os.ui.menu.unit.dispose = function() {
  goog.dispose(os.ui.menu.UNIT);
  os.ui.menu.UNIT = undefined;
};


/**
 * Toggle active unit system.
 * @param {os.ui.action.ActionEvent} event
 */
os.ui.menu.unit.toggleUnit = function(event) {
  os.unit.UnitManager.getInstance().setSelectedSystem(event.type);
};


/**
 * Helper function for changing icons.
 * @this {os.ui.menu.MenuItem}
 */
os.ui.menu.unit.updateIcons = function() {
  var curSystem = os.unit.UnitManager.getInstance().getSelectedSystem();
  if (this.eventType === curSystem) {
    this.icons = ['<i class="fa fa-fw fa-check-circle-o"></i>'];
  } else {
    this.icons = ['<i class="fa fa-fw fa-circle-o"></i>'];
  }
};
