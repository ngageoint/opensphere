goog.provide('os.ui.navbaroptions');
goog.provide('os.ui.navbaroptions.searchbox');

goog.require('os.ui.addDataButtonDirective');
goog.require('os.ui.alert.alertButtonDirective');
goog.require('os.ui.clear.clearButtonDirective');
goog.require('os.ui.draw.drawControlsDirective');
goog.require('os.ui.help');
goog.require('os.ui.list');
goog.require('os.ui.measureButtonDirective');
goog.require('os.ui.muteButtonDirective');
goog.require('os.ui.nav');
goog.require('os.ui.navBottomDirective');
goog.require('os.ui.navTopDirective');
goog.require('os.ui.saveButtonDirective');
goog.require('os.ui.scaleLineDirective');
goog.require('os.ui.search.searchBoxDirective');
goog.require('os.ui.search.searchResultsDirective');
goog.require('os.ui.serversButtonDirective');
goog.require('os.ui.stateButtonDirective');
goog.require('os.ui.windowsButtonDirective');


/**
 * Searchbox Template
 * @type {string}
 */
os.ui.navbaroptions.searchbox = '<search-box show-clear="true"></search-box><searchresults></searchresults>';

// os.ui.list.add(os.ui.AbstractMainContent, '<date-panel></date-panel', 1);

// Top navbar items
os.ui.list.add(os.ui.nav.Location.TOP_LEFT, 'add-data-button', 100);
os.ui.list.add(os.ui.nav.Location.TOP_LEFT, 'save-button', 200);
os.ui.list.add(os.ui.nav.Location.TOP_LEFT, 'state-button', 300);
os.ui.list.add(os.ui.nav.Location.TOP_LEFT, 'windows-button', 400);

os.ui.list.add(os.ui.nav.Location.TOP_LEFT, '<div class="u-btn-separator"></div>', 500);
os.ui.list.add(os.ui.nav.Location.TOP_LEFT, 'os-draw-controls', 600);
os.ui.list.add(os.ui.nav.Location.TOP_LEFT, 'measure-button', 650);
os.ui.list.add(os.ui.nav.Location.TOP_LEFT, 'clear-button', 700);

os.ui.list.add(os.ui.nav.Location.TOP_RIGHT, os.ui.navbaroptions.searchbox, 100);
os.ui.list.add(os.ui.nav.Location.TOP_RIGHT, 'help', 200);


// Bottom navbar options
os.ui.list.add(os.ui.nav.Location.BOTTOM_LEFT, '<li id="zoom-level" class="nav-item mr-1 my-auto"></li>', 100);
os.ui.list.add(os.ui.nav.Location.BOTTOM_LEFT, 'scale-line', 200);
os.ui.list.add(os.ui.nav.Location.BOTTOM_LEFT, '<li id="mouse-position" class="nav-item mr-1 my-auto"></li>', 300);

os.ui.list.add(os.ui.nav.Location.BOTTOM_RIGHT, 'servers-button', 100);
os.ui.list.add(os.ui.nav.Location.BOTTOM_RIGHT, 'alert-button', 200);
os.ui.list.add(os.ui.nav.Location.BOTTOM_RIGHT, 'mute-button', 300);
