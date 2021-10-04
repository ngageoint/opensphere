goog.declareModuleId('os.ui.navbaroptions');

import './navbottom.js';
import './navtop.js';

import * as AddDataButtonUI from '../adddatabutton.js';
import * as AlertButtonUI from '../alert/alertbutton.js';
import * as ClearButtonUI from '../clear/clearbutton.js';
import * as DatePanelUI from '../datepanel.js';
import * as DrawControlsUI from '../draw/drawcontrols.js';
import * as HelpUI from '../help/helpui.js';
import * as HistoryButtonUI from '../history/historybutton.js';
import * as LayersButtonUI from '../layersbutton.js';
import * as LegendButtonUI from '../legendbutton.js';
import * as list from '../list.js';
import * as MuteButtonUI from '../mutebutton.js';
import * as SaveButtonUI from '../savebutton.js';
import * as ScaleLine from '../scaleline.js';
import * as SearchResultsUI from '../search/searchresults.js';
import * as ServersButtonUI from '../serversbutton.js';
import * as SettingsButtonUI from '../settingsbutton.js';
import {getSearchBox} from './navbaroptionssearchbox.js';
import Location from './navlocation.js';
import * as OSNavTopUI from './osnavtop.js';


/**
 * Search results template.
 * @type {string}
 */
let searchResults = `<${SearchResultsUI.directiveTag} parent="#js-main"></${SearchResultsUI.directiveTag}>`;

/**
 * @type {string}
 * @deprecated Please use getSearchResults and setSearchResults instead.
 */
export const searchresults = searchResults;

/**
 * Get the search results UI.
 * @return {string}
 */
export const getSearchResults = () => searchResults;

/**
 * Set the search results UI.
 * @param {string} value
 */
export const setSearchResults = (value) => {
  searchResults = value;
};

/**
 * Initialize the nav bars.
 */
export const init = function() {
  // Add the top nav bar
  list.add(Location.HEADER, OSNavTopUI.directiveTag, 100);

  // Top navbar items
  list.add(Location.TOP_LEFT, AddDataButtonUI.directiveTag, 100);
  list.add(Location.TOP_LEFT, LayersButtonUI.directiveTag, 200);
  list.add(Location.TOP_LEFT,
      `<${DrawControlsUI.directiveTag} show-label="!puny"></${DrawControlsUI.directiveTag}>`, 300);
  list.add(Location.TOP_LEFT, ClearButtonUI.directiveTag, 500);

  list.add(Location.TOP_CENTER, DatePanelUI.directiveTag, 1);

  list.add(Location.TOP_RIGHT, SaveButtonUI.directiveTag, 300);
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
