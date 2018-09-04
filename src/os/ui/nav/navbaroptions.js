goog.provide('os.ui.navbaroptions');
goog.provide('os.ui.navbaroptions.searchbox');

goog.require('os.ui.addDataButtonDirective');
goog.require('os.ui.alert.alertButtonDirective');
goog.require('os.ui.clear.clearButtonDirective');
goog.require('os.ui.datePanelDirective');
goog.require('os.ui.draw.drawControlsDirective');
goog.require('os.ui.help');
goog.require('os.ui.history.historyButtonDirective');
goog.require('os.ui.layersButtonDirective');
goog.require('os.ui.legendButtonDirective');
goog.require('os.ui.list');
goog.require('os.ui.measureButtonDirective');
goog.require('os.ui.muteButtonDirective');
goog.require('os.ui.nav');
goog.require('os.ui.navBottomDirective');
goog.require('os.ui.navTopDirective');
goog.require('os.ui.osNavTopDirective');
goog.require('os.ui.saveButtonDirective');
goog.require('os.ui.scaleLineDirective');
goog.require('os.ui.search.searchBoxDirective');
goog.require('os.ui.serversButtonDirective');
goog.require('os.ui.settingsButtonDirective');
goog.require('os.ui.stateButtonDirective');
goog.require('os.ui.windowsButtonDirective');


/**
 * Help template.
 * @type {string}
 */
os.ui.navbaroptions.help = 'help';


/**
 * Search box template.
 * @type {string}
 */
os.ui.navbaroptions.searchbox = '<search-box show-clear="true"></search-box>';


/**
 * Search results template.
 * @type {string}
 */
os.ui.navbaroptions.searchresults = '<searchresults parent="#js-main"></searchresults>';


/**
 * Initialize the nav bars.
 */
os.ui.navbaroptions.init = function() {
  // Add the top nav bar
  os.ui.list.add(os.ui.nav.Location.HEADER, 'os-nav-top', 100);

  // Top navbar items
  os.ui.list.add(os.ui.nav.Location.TOP_LEFT, 'add-data-button', 100);
  os.ui.list.add(os.ui.nav.Location.TOP_LEFT, 'layers-button', 200);
  os.ui.list.add(os.ui.nav.Location.TOP_LEFT, 'os-draw-controls', 300);
  os.ui.list.add(os.ui.nav.Location.TOP_LEFT, 'measure-button', 400);
  os.ui.list.add(os.ui.nav.Location.TOP_LEFT, 'clear-button', 500);

  os.ui.list.add(os.ui.nav.Location.TOP_CENTER, 'date-panel', 1);

  os.ui.list.add(os.ui.nav.Location.TOP_RIGHT, 'save-button', 200);
  os.ui.list.add(os.ui.nav.Location.TOP_RIGHT, 'state-button', 300);
  os.ui.list.add(os.ui.nav.Location.TOP_RIGHT, os.ui.navbaroptions.searchbox, 900);
  os.ui.list.add(os.ui.nav.Location.TOP_RIGHT, os.ui.navbaroptions.help, 1000);

  // Bottom navbar options
  os.ui.list.add(os.ui.nav.Location.BOTTOM_LEFT,
      '<li id="zoom-level" class="nav-item mr-1 my-auto flex-shrink-0"></li>', 100);
  os.ui.list.add(os.ui.nav.Location.BOTTOM_LEFT, '<scale-line></scale-line>', 200);
  os.ui.list.add(os.ui.nav.Location.BOTTOM_LEFT,
      '<li id="mouse-position" class="nav-item mr-1 my-auto flex-shrink-0"></li>', 300);

  os.ui.list.add(os.ui.nav.Location.BOTTOM_RIGHT, 'settings-button', 100);
  os.ui.list.add(os.ui.nav.Location.BOTTOM_RIGHT, 'legend-button', 200);
  os.ui.list.add(os.ui.nav.Location.BOTTOM_RIGHT, 'servers-button', 300);
  os.ui.list.add(os.ui.nav.Location.BOTTOM_RIGHT, 'alert-button', 400);
  os.ui.list.add(os.ui.nav.Location.BOTTOM_RIGHT, 'history-button', 500);
  os.ui.list.add(os.ui.nav.Location.BOTTOM_RIGHT, 'mute-button', 600);
};
