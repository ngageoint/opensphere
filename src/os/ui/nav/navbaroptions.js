goog.module('os.ui.navbaroptions');

goog.require('os.ui.navBottomDirective');
goog.require('os.ui.navTopDirective');

const AddDataButtonUI = goog.require('os.ui.AddDataButtonUI');
const DatePanelUI = goog.require('os.ui.DatePanelUI');
const LayersButtonUI = goog.require('os.ui.LayersButtonUI');
const LegendButtonUI = goog.require('os.ui.LegendButtonUI');
const MuteButtonUI = goog.require('os.ui.MuteButtonUI');
const OSNavTopUI = goog.require('os.ui.OSNavTopUI');
const SaveButtonUI = goog.require('os.ui.SaveButtonUI');
const ScaleLine = goog.require('os.ui.ScaleLine');
const ServersButtonUI = goog.require('os.ui.ServersButtonUI');
const SettingsButtonUI = goog.require('os.ui.SettingsButtonUI');
const StateButtonUI = goog.require('os.ui.StateButtonUI');
const AlertButtonUI = goog.require('os.ui.alert.AlertButtonUI');
const ClearButtonUI = goog.require('os.ui.clear.ClearButtonUI');
const DrawControlsUI = goog.require('os.ui.draw.DrawControlsUI');
const HelpUI = goog.require('os.ui.help.HelpUI');
const HistoryButtonUI = goog.require('os.ui.history.HistoryButtonUI');
const list = goog.require('os.ui.list');
const Location = goog.require('os.ui.nav.Location');
const {getSearchBox} = goog.require('os.ui.navbaroptions.searchbox');
const SearchResultsUI = goog.require('os.ui.search.SearchResultsUI');


/**
 * Search results template.
 * @type {string}
 */
let searchResults = `<${SearchResultsUI.directiveTag} parent="#js-main"></${SearchResultsUI.directiveTag}>`;

/**
 * @type {string}
 * @deprecated Please use getSearchResults and setSearchResults instead.
 */
const searchresults = searchResults;

/**
 * Get the search results UI.
 * @return {string}
 */
const getSearchResults = () => searchResults;

/**
 * Set the search results UI.
 * @param {string} value
 */
const setSearchResults = (value) => {
  searchResults = value;
};

/**
 * Initialize the nav bars.
 */
const init = function() {
  // Add the top nav bar
  list.add(Location.HEADER, OSNavTopUI.directiveTag, 100);

  // Top navbar items
  list.add(Location.TOP_LEFT, AddDataButtonUI.directiveTag, 100);
  list.add(Location.TOP_LEFT, LayersButtonUI.directiveTag, 200);
  list.add(Location.TOP_LEFT,
      `<${DrawControlsUI.directiveTag} show-label="!puny"></${DrawControlsUI.directiveTag}>`, 300);
  list.add(Location.TOP_LEFT, ClearButtonUI.directiveTag, 500);

  list.add(Location.TOP_CENTER, DatePanelUI.directiveTag, 1);

  list.add(Location.TOP_RIGHT, SaveButtonUI.directiveTag, 200);
  list.add(Location.TOP_RIGHT, StateButtonUI.directiveTag, 300);
  list.add(Location.TOP_RIGHT, getSearchBox(), 900);
  list.add(Location.TOP_RIGHT, HelpUI.directiveTag, 1000);

  // Bottom navbar options
  list.add(Location.BOTTOM_LEFT,
      '<div id="zoom-level" class="nav-item mr-1 my-auto flex-shrink-0"></div>', 100);
  list.add(Location.BOTTOM_LEFT, `<${ScaleLine.directiveTag}></${ScaleLine.directiveTag}>`, 200);
  list.add(Location.BOTTOM_LEFT,
      '<div id="mouse-position" class="nav-item mr-1 my-auto flex-shrink-0"></div>', 300);

  list.add(Location.BOTTOM_RIGHT, '<div id="js-dock-bottom-micro__container"></div>', 0);
  list.add(Location.BOTTOM_RIGHT, SettingsButtonUI.directiveTag, 100);
  list.add(Location.BOTTOM_RIGHT, LegendButtonUI.directiveTag, 200);
  list.add(Location.BOTTOM_RIGHT, ServersButtonUI.directiveTag, 300);
  list.add(Location.BOTTOM_RIGHT, AlertButtonUI.directiveTag, 400);
  list.add(Location.BOTTOM_RIGHT, HistoryButtonUI.directiveTag, 500);
  list.add(Location.BOTTOM_RIGHT, MuteButtonUI.directiveTag, 600);
};

exports = {
  searchresults,
  getSearchResults,
  setSearchResults,
  init
};
