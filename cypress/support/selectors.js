exports.Application = {
  PAGE: 'body',
  FILE_INPUT: 'input[type=\'file\']'
};

exports.Toolbar = {
  TOOLBAR: '.o-navtop',
  addData: {
    BUTTON: '#addDataButton',
    OPEN_FILE_BUTTON: '[title=\'Open a file or URL\'',
    Dropdown: {
      BUTTON: '.o-add-data-button .dropdown-toggle',
      MENU: '#menu',
      ADD_DATA: '[title=\'Browse the data catalog\']',
      OPEN_FILE_OR_URL: '[title=\'Import data from a local file or a URL\']',
      ADD_CESIUM_ION_ASSET: '[title=\'Loads a Cesium Ion asset in 3D mode\']',
      RECENT_STREET_MAP: ':contains(\'Street Map (Map)\').text-truncate',
      RECENT_WORLD_IMAGERY: ':contains(\'World Imagery (Map)\').text-truncate'
    }
  },
  LAYERS_BUTTON: '[title=\'View Layers\']',
  Drawing: {
    BUTTON: '[title=\'Draws a box on the map for queries, zoom, and selection\']',
    BUTTON_IS_ACTIVE: 'active',
    Dropdown: {
      BUTTON: '[ng-click=\'drawControls.toggleMenu()\']',
      MENU: '#menu',
      BOX: ':contains(\'Box\')[role=\'menuitem\']',
      CIRCLE: ':contains(\'Circle\')[role=\'menuitem\']',
      POLYGON: ':contains(\'Polygon\')[role=\'menuitem\']',
      LINE: ':contains(\'Line\')[role=\'menuitem\']',
      CHOOSE_AREA: ':contains(\'Choose Area\')[role=\'menuitem\']',
      ENTER_COORDINATES: ':contains(\'Enter Coordinates\')[role=\'menuitem\']',
      WHOLE_WORLD: ':contains(\'Whole World\')[role=\'menuitem\']'
    }
  },
  Measure: {
    BUTTON: '#measureButton',
    BUTTON_IS_ACTIVE: 'active',
    Dropdown: {
      BUTTON: '.btn-secondary.dropdown-toggle-split[ng-click=\'ctrl.openMenu()\']',
      MENU: '#menu',
      MEASURE_GEODESIC: '[title=\'Measures the shortest distance between two points (variable bearing).\']',
      MEASURE_RHUMB_LINE: '[title=\'Measures the path of constant bearing between two points.\']'
    }
  },
  CLEAR_BUTTON: '[title=\'Select items to clear/reset\']',
  PREVIOUS_DAY_BUTTON: '[title=\'Previous day\']',
  Date: {
    FIELD: '[placeholder=Date]',
    Calendar: {
      PANEL: '#ui-datepicker-div',
      MONTH: '.ui-datepicker-month',
      YEAR: '.ui-datepicker-year',
      CURRENT_DAY: '.ui-state-active',
      TODAY_BUTTON: '.ui-datepicker-current',
      CLOSE_BUTTON: '.ui-datepicker-close'
    }
  },
  NEXT_DAY_BUTTON: '[title=\'Next day\']',
  DURATION_SELECT: '[title=Duration]',
  timeFilter: {
    BUTTON: '[title=\'Show/hide time filter panel\']',
    BUTTON_IS_ACTIVE: 'btn-success',
    PANEL: '.c-date-panel__extended',
    START_HOUR: '[ng-model=\'ctrl.startHour\']',
    START_MINUTE: '[ng-model=\'ctrl.startMinute\']',
    END_HOUR: '[ng-model=\'ctrl.endHour\']',
    END_MINUTE: '[ng-model=\'ctrl.endMinute\']',
    APPLY_BUTTON: '[title=\'Apply time slice\']'
  },
  TIMELINE_TOGGLE: '#timelineButton',
  Save: {
    BUTTON: '[title=\'Save options\']',
    MENU: '#menu',
    STATE: '[title=\'Save the application state\']',
    SCREENSHOT: '[title=\'Save a screenshot\']'
  },
  States: {
    BUTTON: '[title=\'State options\']',
    MENU: '#menu',
    IMPORT_STATE: '[title=\'Import a state from a local file or a URL\']',
    SAVE_STATE: '[title=\'Save the application state\']',
    DISABLE_STATES: '[title=\'Disable all active application states\']'
  },
  Search: {
    Dropdown: {
      BUTTON: '.c-search-box__dropdown',
      MENU: '.js-searchbox__search-options',
      COORDINATES: ':contains(\'Coordinates\') .dropdown-item',
      LAYERS: ':contains(\'Layers\') .dropdown-item'
    },
    Results: {
      PANEL: '.c-searchresults'
    },
    FIELD: '.c-search-box__input',
    CLEAR_BUTTON: '[title=\'Clear search\']',
    BUTTON: '[type=submit]'
  },
  Support: {
    BUTTON: '[title=Support]',
    MENU: '#menu',
    ABOUT: '[title=\'About OpenSphere\']',
    CONTROLS: '[title=\'Keyboard and mouse controls\']',
    SHOW_TIPS: '[title=\'Reset help tips, and show the initial set of tips\']',
    OPENSPHERE_CAPABILITIES: '[title=\'Display the OpenSphere Capabilities\']',
    VIEW_ALERTS: '[title=\'Display the alert log\']',
    VIEW_LOG: '[title=\'Display the application log\']',
    RESET_SETTINGS: '[evt-type=\'displayClearLocalStorage\']'
  }
};

exports.Map = {
  CONTAINER: '#map-container',
  CANVAS_3D: '.webgl-canvas',
  CANVAS_2D: '.canvas:eq(0)',
  OVERVIEW_MAP: '.ol-overviewmap-map',
  OVERVIEW_MAP_TOGGLE: '[title=\'Overview map\']',
  ZOOM_IN_BUTTON: '.ol-zoom-in',
  ZOOM_OUT_BUTTON: '.ol-zoom-out',
  ROTATION_BUTTON: '.ol-compass',
  MAP_MODE_BUTTON: '.ol-mapmode-toggle'
};

exports.Timeline = {
  PANEL: '[ng-if=\'mainCtrl.timeline\']',
  VIEW_WINDOW: '.extent:eq(0)',
  HISTOGRAM_POINTS: '.c-histogram-group__line-point',
  START_DATE_TIME: '.order-0',
  PLAY_BUTTON: '[title=\'Toggle animation of tiles/features on the map\']',
  PAUSE_BUTTON: '[title=\'Toggle animation of tiles/features on the map\']',
  RECORD_BUTTON: '#timeline-record-button',
  END_DATE_TIME: '.order-md-2'
};

exports.statusBar = {
  STATUSBAR: '.o-navbottom',
  ALTITUDE: '.altitude-text',
  ZOOM: '.zoom-text',
  Scale: {
    BAR: '.ol-scale-line',
    MENU: '#menu',
    IMPERIAL: '[title=\'Switches to Imperial\']',
    METRIC: '[title=\'Switches to Metric\']',
    NAUTICAL: '[title=\'Switches to Nautical\']',
    NAUTICAL_MILES_ONLY: '[title=\'Switches to Nautical Miles Only\']',
    MILES_ONLY: '[title=\'Switches to Miles Only\']',
    YARDS_ONLY: '[title=\'Switches to Yards Only\']',
    FEET_ONLY: '[title=\'Switches to Feet Only\']'
  },
  COORDINATES: '.ol-mouse-position',
  SETTINGS_BUTTON: '[title=\'View Settings\']',
  LEGEND_BUTTON: '[title=\'View Legend\']',
  SERVERS_BUTTON: '[title=Servers]',
  ALERTS_BUTTON: '[title=Alerts]',
  ALERTS_UNREAD: '.badge',
  HISTORY_BUTTON: '[title=History]',
  Mute: {
    BUTTON: '.fa-volume-off, .fa-volume-up',
    SOUND_ON: 'fa-volume-up',
    SOUND_OFF: 'fa-volume-off'
  }
};

exports.layersDialog = {
  DIALOG: '[label=Layers]',
  DIALOG_HEADER: '.js-window__header',
  DIALOG_CLOSE: '[label=Layers] .close',
  ACTIVE_TAB: '.active.nav-link',
  LAYERS_TAB: '.nav-link:eq(0)',
  AREAS_TAB: '.nav-link:eq(1)',
  FILTERS_TAB: '.nav-link:eq(2)',
  PLACES_TAB: '.nav-link:eq(3)',
  Layers: {
    ADD_DATA_BUTTON: '[label=\'Layers\'] [title=\'Add data to the map\']',
    SEARCH_FIELD: '[placeholder=\'Search active layers\']',
    Tree: {
      LAYER_1: '.slick-row:eq(0)',
      LAYER_2: '.slick-row:eq(1)',
      LAYER_3: '.slick-row:eq(2)',
      LAYER_4: '.slick-row:eq(3)',
      LAYER_5: '.slick-row:eq(4)',
      LAYER_6: '.slick-row:eq(5)',
      LAYER_7: '.slick-row:eq(6)',
      LAYER_8: '.slick-row:eq(7)',
      LAYER_9: '.slick-row:eq(8)',
      LAYER_10: '.slick-row:eq(9)',
      LAYER_TOGGLE: '[title=\'Show or hide the layer\']',
      LAYER_FEATURE_COUNT: 'span:eq(8)',
      REMOVE_LAYER: '[title=\'Remove the layer\']',
      LAYER_IS_ACTIVE: 'c-tristate-on',
      LAYER_IS_INACTIVE: 'c-tristate-off',
      STREET_MAP_TILES: ':contains(\'Street Map Tiles\').slick-row',
      WORLD_IMAGERY_TILES: ':contains(\'World Imagery Tiles\').slick-row'
    },
    contextMenu: {
      EDIT_PARAMETERS: '[title=\'Edit request parameters for the layer\']',
      GO_TO: '[title=\'Repositions the map to show the layer\']',
      IDENTIFY: '[title=\'Identifies a layer on the map\']',
      CLEAR_SELECTION: '[title=\'Clears the selection for the layer\']',
      REMOVE_FROM_TIMELINE: '[title=\'Disables layer animation when the timeline is open\']',
      MOST_RECENT: '[title=\'Adjusts application time to show the most recent data for the layer\']',
      REFRESH: '[title=\'Refreshes the layer\']',
      LOCK: '[title=\'Lock the layer to prevent data from changing\']',
      REMOVE: '[title=\'Removes the layer\']',
      RENAME: '[title=\'Rename the layer\']',
      SHOW_DESCRIPTION: '[title=\'Gives details about the layer\']',
      EXPORT: '[title=\'Exports data from this layer\']',
      CREATE_BUFFER_REGION: '[title=\'Create buffer regions around loaded data\']',
      FEATURE_ACTIONS: '[title=\'Perform actions on imported data matching a filter\']',
      GENERATE_HEATMAP: '[title=\'Generate a heatmap of current features\']',
      Copy: {
        TOP_LEVEL: ':contains(\'Copy\').ui-menu-item',
        ALL: '[evt-type=\'layer.copy 1\']',
        SHOWN: '[evt-type=\'layer.copy 2\']',
        SELECTED: '[evt-type=\'layer.copy 3\']',
        UNSELECTED: '[evt-type=\'layer.copy 4\']',
        HIDDEN: '[evt-type=\'layer.copy 5\']'
      },
      Merge: {
        TOP_LEVEL: ':contains(\'Merge\').ui-menu-item',
        ALL: '[evt-type=\'layer.merge 1\']',
        SHOWN: '[evt-type=\'layer.merge 2\']',
        SELECTED: '[evt-type=\'layer.merge 3\']',
        UNSELECTED: '[evt-type=\'layer.merge 4\']',
        HIDDEN: '[evt-type=\'layer.merge 5\']'
      },
      Join: {
        TOP_LEVEL: ':contains(\'Join\').ui-menu-item',
        ALL: '[evt-type=\'layer.join 1\']',
        SHOWN: '[evt-type=\'layer.join 2\']',
        SELECTED: '[evt-type=\'layer.join 3\']',
        UNSELECTED: '[evt-type=\'layer.join 4\']',
        HIDDEN: '[evt-type=\'layer.join 5\']'
      }
    }
  },
  Areas: {
    SEARCH_FIELD: '[placeholder=\'Search areas\']',
    EXPORT_BUTTON: '[ng-click=\'areasCtrl.export()\']',
    IMPORT_BUTTON: '[ng-click=\'areasCtrl.import()\']',
    ADVANCED_BUTTON: '[ng-click=\'areasCtrl.launch()\']',
    Tree: {
      AREA_1: '.slick-row:eq(0)',
      AREA_2: '.slick-row:eq(1)',
      AREA_3: '.slick-row:eq(2)',
      AREA_4: '.slick-row:eq(3)',
      AREA_5: '.slick-row:eq(4)',
      AREA_6: '.slick-row:eq(5)',
      AREA_7: '.slick-row:eq(6)',
      AREA_8: '.slick-row:eq(7)',
      AREA_9: '.slick-row:eq(8)',
      AREA_10: '.slick-row:eq(9)',
      REMOVE_AREA: '[title=\'Remove the area\']',
      TEMP_AREA_1: ':contains(\'temp area 1\')',
      TEMP_AREA_2: ':contains(\'temp area 2\')',
      TEMP_AREA_3: ':contains(\'temp area 3\')',
      TEMP_AREA_4: ':contains(\'temp area 4\')',
      TEMP_AREA_5: ':contains(\'temp area 5\')',
      TEMP_AREA_6: ':contains(\'temp area 6\')',
      TEMP_AREA_7: ':contains(\'temp area 7\')',
      TEMP_AREA_8: ':contains(\'temp area 8\')',
      TEMP_AREA_9: ':contains(\'temp area 9\')',
      TEMP_AREA_10: ':contains(\'temp area 10\')',
      WHOLE_WORLD_AREA: ':contains(\'Whole World\') .slick-cell'
    },
    contextMenu: {
      LOAD: '[title=\'Clear queries, then query for this area for all layers\']',
      ADD_QUERY: '[title=\'Add a query for this area for all layers\']',
      queryChooseLayers: {
        TOP_LEVEL: ':contains(\'Copy\').ui-menu-item:eq(0)',
        FEATURES: '[title=\'Query area for layes of type (Features)\']',
        CUSTOM: '[evt-type=\'add:custom\']'
      },
      SET: '[title=\'Clear exclusions, then add an exclusion area for all layers\']',
      ADD_EXCLUSION: '[title=\'Add an exclusion area for all layers\']',
      excludeChooseLayers: {
        TOP_LEVEL: ':contains(\'Copy\').ui-menu-item:eq(1)',
        FEATURES: '[title=\'Exclude area for layes of type (Features)\']',
        CUSTOM: '[evt-type=\'add_exclude:custom\']'
      },
      SELECT: '[title=\'Select features in this area\']',
      SELECT_EXCLUSIVE: '[title=\'Select only features in this area, deselecting features outside of the area\']',
      DESELECT: '[title=\'Deselect features in this area\']',
      REMOVE_FEATURES_IN_AREA: '[title=\'Remove features in this area from the map\']',
      CREATE_BUFFER_REGION: '[title=\'Create a buffer region from the feature(s)\']',
      SAVE_TO_PLACES: '[title=\'Creates a new saved place from the area\']',
      ZOOM: '[title=\'Zoom the map to the feature(s)\']',
      EDIT_AREA_DETAILS: '[title=\'Edit area information such as title/description\']',
      DISABLE_AREA: '[title=\'Disable the area\']',
      ENABLE_AREA: '[title=\'Enable the area\']',
      EXPORT: '[title=\'Export the area\']',
      REMOVE_AREA: '#menu [title=\'Remove the area\']'
    }
  },
  Filters: {
    SEARCH_FIELD: '[placeholder=\'Search...\']',
    EXPORT_BUTTON: '[ng-click=\'filtersCtrl.export()\']',
    IMPORT_BUTTON: '[ng-click=\'filtersCtrl.import()\']',
    ADVANCED_BUTTON: '[ng-click=\'filtersCtrl.launch()\']',
    Tree: {
      FILTER_1: '.slick-row:eq(0)',
      FILTER_2: '.slick-row:eq(1)',
      FILTER_3: '.slick-row:eq(2)',
      FILTER_4: '.slick-row:eq(3)',
      FILTER_5: '.slick-row:eq(4)',
      FILTER_6: '.slick-row:eq(5)',
      FILTER_7: '.slick-row:eq(6)',
      FILTER_8: '.slick-row:eq(7)',
      FILTER_9: '.slick-row:eq(8)',
      FILTER_10: '.slick-row:eq(9)',
      REMOVE_FILTER: '[ng-click=\'nodeUi.remove()\']'
    }
  },
  Places: {
    ADD_FOLDER_BUTTON: '[ng-click=\'places.addFolder()\']',
    ADD_PLACE_BUTTON: '[ng-click=\'places.addPlace()\']',
    EXPORT_BUTTON: '[ng-click=\'places.export()\']',
    Tree: {
      PLACE_1: '.slick-row:eq(0)',
      PLACE_2: '.slick-row:eq(1)',
      PLACE_3: '.slick-row:eq(2)',
      PLACE_4: '.slick-row:eq(3)',
      PLACE_5: '.slick-row:eq(4)',
      PLACE_6: '.slick-row:eq(5)',
      PLACE_7: '.slick-row:eq(6)',
      PLACE_8: '.slick-row:eq(7)',
      PLACE_9: '.slick-row:eq(8)',
      PLACE_10: '.slick-row:eq(9)'
    }
  }
};

exports.addDataDialog = {
  DIALOG: '#addData',
  DIALOG_HEADER: '[title=\'Add Data\']',
  DIALOG_CLOSE: '#addData .close',
  SEARCH_FIELD: '[placeholder=\'Search available layers\']',
  Tree: {
    LAYER_1: '#addData .slick-row:eq(0)',
    LAYER_2: '#addData .slick-row:eq(1)',
    LAYER_3: '#addData .slick-row:eq(2)',
    LAYER_4: '#addData .slick-row:eq(3)',
    LAYER_5: '#addData .slick-row:eq(4)',
    LAYER_6: '#addData .slick-row:eq(5)',
    LAYER_7: '#addData .slick-row:eq(6)',
    LAYER_8: '#addData .slick-row:eq(7)',
    LAYER_9: '#addData .slick-row:eq(8)',
    LAYER_10: '#addData .slick-row:eq(9)',
    LAYER_TOGGLE: '[title=\'Activates or deactivates the layer\']',
    LAYER_IS_ON: 'c-toggle-switch-on',
    LAYER_IS_OFF: 'c-toggle-switch-off'

  },
  CLOSE_BUTTON: '[ng-click=\'addData.close()\']'
};

exports.importDataDialog = {
  DIALOG: '#urlimport',
  DIALOG_HEADER: '[title=\'Import Data\']',
  DIALOG_CLOSE: '#urlimport .close',
  CHOOSE_A_FILE_OR_URL: '[placeholder=\'Choose a file or enter a URL\']',
  BROWSE_BUTTON: '[title=\'Choose a local file\']',
  NEXT_BUTTON: '[title=\'Load the file for import\']',
  CANCEL_BUTTON: '[title=\'Cancel file import\']'
};

exports.importCesiumIonAssetDialog = {
  DIALOG: '#importIonAsset',
  DIALOG_HEADER: '[title=\'Import Cesium Ion Asset\']',
  DIALOG_CLOSE: '#importIonAsset .close',
  CANCEL_BUTTON: '[ng-click=\'ctrl.close()\']'
};

exports.chooseAreaDialog = {
  DIALOG: '[label=\'Choose Area\']',
  DIALOG_HEADER: '[title=\'Choose Area\']',
  CANCEL_BUTTON: '[ng-click=\'confirm.cancel()\']'
};

exports.enterAreaCoordinatesDialog = {
  DIALOG: '[label=\'Enter Area Coordinates\']',
  DIALOG_HEADER: '[title=\'Enter Area Coordinates\']',
  DIALOG_CLOSE: '[label=\'Enter Area Coordinates\'] .close',
  CANCEL_BUTTON: '[ng-click=\'confirm.cancel()\']'
};

exports.clearDialog = {
  DIALOG: '#clear',
  DIALOG_HEADER: '[title=Clear]',
  DIALOG_CLOSE: '[label=Clear] .close',
  OK_BUTTON: '[ng-click=\'clear.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'clear.cancel()\']',
  List: {
    ALL: ':contains(\'All\').custom-control',
    EXCLUSION_AREAS: ':contains(\'Exclusion Areas\').custom-control',
    LAYER_AREA_FILTER_QUERY_COMBINATIONS: ':contains(\'Layer/Area/Filter query combinations\').custom-control',
    LAYERS: ':contains(\'Layers\').custom-control',
    MAP_POSITION: ':contains(\'Map Position\').custom-control',
    NONQUERY_FEATURES: ':contains(\'Non-query Features\').custom-control',
    QUERY_AREAS: ':contains(\'Query_Areas\').custom-control',
    STATES: ':contains(\'States\').custom-control'
  }
};

exports.saveStateDialog = {
  DIALOG: '#stateExport',
  DIALOG_HEADER: '[title=\'Save State\']',
  DIALOG_CLOSE: '#stateExport .close',
  OK_BUTTON: '[ng-click=\'stateForm.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'stateForm.close()\']'
};

exports.aboutDialog = {
  DIALOG: '#aboutModal',
  DIALOG_HEADER: '[title=\'About\']',
  DIALOG_CLOSE: '#aboutModal .close',
  CLOSE_BUTTON: '.btn[data-dismiss=\'modal\']'
};

exports.controlsDialog = {
  DIALOG: '#controlsHelp',
  DIALOG_HEADER: '[title=\'Controls\']',
  DIALOG_CLOSE: '#controlsHelp .close'
};

exports.welcomeToOpenSphereDialog = {
  DIALOG: '.js-onboarding__popover',
  DIALOG_HEADER: '.popover-header',
  DIALOG_CLOSE: '.js-onboarding__popover .close',
  STOP_SHOWING_TIPS: '[ng-click=\'ngOnboardCtrl.stopShowing()\']',
  NEXT: '[ng-click=\'ngOnboardCtrl.next()\']'
};

exports.openSphereCapabilitiesDialog = {
  DIALOG: '[label=\'OpenSphere Capabilities\']',
  DIALOG_HEADER: '[title=\'OpenSphere Capabilities\']',
  DIALOG_CLOSE: '[label=\'OpenSphere Capabilities\'] .close',
  CLOSE_BUTTON: '[ng-click=\'setCon.close()\']',
  Tree: {
    CAPABILITY_1: '[label=\'OpenSphere Capabilities\'] .slick-row:eq(0)',
    CAPABILITY_2: '[label=\'OpenSphere Capabilities\'] .slick-row:eq(1)',
    CAPABILITY_3: '[label=\'OpenSphere Capabilities\'] .slick-row:eq(2)',
    CAPABILITY_4: '[label=\'OpenSphere Capabilities\'] .slick-row:eq(3)',
    CAPABILITY_5: '[label=\'OpenSphere Capabilities\'] .slick-row:eq(4)',
    CAPABILITY_6: '[label=\'OpenSphere Capabilities\'] .slick-row:eq(5)',
    CAPABILITY_7: '[label=\'OpenSphere Capabilities\'] .slick-row:eq(6)',
    CAPABILITY_8: '[label=\'OpenSphere Capabilities\'] .slick-row:eq(7)',
    CAPABILITY_9: '[label=\'OpenSphere Capabilities\'] .slick-row:eq(8)',
    CAPABILITY_10: '[label=\'OpenSphere Capabilities\'] .slick-row:eq(9)'
  },
  SEARCH_FIELD: '[placeholder=\'Search features\']'
};

exports.resetSettingsDialog = {
  DIALOG: '[label=\'Reset Settings\']',
  DIALOG_HEADER: '[title=\'Reset Settings\']',
  CLEAR_AND_RELOAD_BUTTON: '[ng-class=\'yesButtonClass\']',
  CANCEL_BUTTON: '[ng-class=\'noButtonClass\']'
};

exports.settingsDialog = {
  DIALOG: '#settings',
  DIALOG_HEADER: '[title=\'Settings\']',
  DIALOG_CLOSE: '#settings .close',
  RESET_BUTTON: '[ng-click=\'setCon.reset();\']',
  CLOSE_BUTTON: '[ng-click=\'setCon.close()\']',
  Tabs: {
    ACTIVE_TAB: '.selected',
    COLUMN_ASSOCIATIONS_TAB: ':contains("Column Associations").slick-cell',
    DATA_SERVERS_TAB: ':contains("Data Servers").slick-cell',
    LOCATION_FORMAT_TAB: ':contains("Location Format").slick-cell',
    Map: {
      AREAS_TAB: ':contains("Areas").slick-cell',
      BEARING_TAB: ':contains("Bearing").slick-cell',
      DISPLAY_TAB: ':contains("Display").slick-cell',
      INTERPOLATION_TAB: ':contains("Interpolation").slick-cell',
      LEGEND_TAB: ':contains("Legend").slick-cell',
      PROJECTION_TAB: ':contains("Projection").slick-cell',
      UNITS_TAB: ':contains("Units").slick-cell'
    },
    THEME: ':contains("Theme").slick-cell'
  },
  Panel: {
    columnAssociations: {
      PANEL: ':contains("Column Associations").container-fluid'
    },
    dataServers: {
      PANEL: ':contains("Data Servers").container-fluid',
      ADD_SERVER_BUTTON: '[title=\'Add a new server\']',
      SERVER_1: '[ng-repeat=\'item in data\']:eq(0)',
      SERVER_2: '[ng-repeat=\'item in data\']:eq(1)',
      SERVER_3: '[ng-repeat=\'item in data\']:eq(2)',
      SERVER_4: '[ng-repeat=\'item in data\']:eq(3)',
      SERVER_5: '[ng-repeat=\'item in data\']:eq(4)',
      SERVER_6: '[ng-repeat=\'item in data\']:eq(5)',
      SERVER_7: '[ng-repeat=\'item in data\']:eq(6)',
      SERVER_8: '[ng-repeat=\'item in data\']:eq(7)',
      SERVER_9: '[ng-repeat=\'item in data\']:eq(8)',
      SERVER_10: '[ng-repeat=\'item in data\']:eq(9)',
      SERVER_ONLINE: '[title=\'Online\']',
      SERVER_OFFLINE: '[title=\'Offline\']',
      DELETE_SERVER: '[title=\'Delete server\']'
    },
    locationFormat: {
      PANEL: ':contains("Location Format").container-fluid'
    },
    Map: {
      Areas: {
        PANEL: ':contains("Areas").container-fluid'
      },
      Bearing: {
        PANEL: ':contains("Bearing").container-fluid'
      },
      Display: {
        PANEL: ':contains("Display").container-fluid'
      },
      Interpolation: {
        PANEL: ':contains("Interpolation").container-fluid'
      },
      Legend: {
        PANEL: ':contains("Legend").container-fluid'
      },
      Projection: {
        PANEL: ':contains("Projection").container-fluid'
      },
      Units: {
        PANEL: ':contains("Units").container-fluid'
      }
    },
    Theme: {
      PANEL: ':contains("Theme").container-fluid'
    }
  }
};

exports.legendWidget = {
  WIDGET: '[ng-if=\'mainCtrl.legend\']',
  SETTINGS_BUTTON: '[title=\'Open settings\']',
  WIDGET_CLOSE: '[title=\'Close the legend\']'
};

exports.alertsDialog = {
  DIALOG: '#alerts',
  DIALOG_HEADER: '[title=\'Alerts\']',
  DIALOG_CLOSE: '#alerts .close',
  CLEAR_ALERTS_BUTTON: '[title=\'Clear all alerts\']'
};

exports.historyDialog = {
  DIALOG: '#history',
  DIALOG_HEADER: '[title=\'History\']',
  DIALOG_CLOSE: '#history .close',
  CLEAR_HISTORY_BUTTON: '[title=\'Clear all history\']'
};

exports.importURLDialog = {
  DIALOG: '#urlimport',
  DIALOG_HEADER: '[title=\'Import URL\']',
  DIALOG_CLOSE: '#urlimport .close',
  ENTER_A_URL_FIELD: '[name=\'url\']',
  NEXT_BUTTON: '[title=\'Import the URL\']',
  CANCEL_BUTTON: '[title=\'Cancel URL import\']'
};

exports.addGeoServerDialog = {
  DIALOG: '[label=\'Add GeoServer\']',
  DIALOG_HEADER: '[title=\'Add GeoServer\']',
  DIALOG_CLOSE: '[label=\'Add GeoServer\'] .close',
  TITLE_FIELD: '[name=\'title\']',
  URL_FIELD: '[name=\'url\']',
  SAVE_BUTTON: '[ng-click=\'ctrl.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'ctrl.close()\']'
};

exports.addArcServerDialog = {
  DIALOG: '[label=\'Add Arc Server\']',
  DIALOG_HEADER: '[title=\'Add Arc Server\']',
  DIALOG_CLOSE: '[label=\'Add Arc Server\'] .close',
  TITLE_FIELD: '[name=\'title\']',
  URL_FIELD: '[name=\'url\']',
  SAVE_BUTTON: '[ng-click=\'ctrl.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'ctrl.close()\']'
};

exports.geoJSONAreaImportDialog = {
  DIALOG: '[label=\'GeoJSON Area Import\']',
  DIALOG_HEADER: '[title=\'GeoJSON Area Import\']',
  DIALOG_CLOSE: '[label=\'GeoJSON Area Import\'] .close',
  areaTab: {
    TITLE_COLUMN_FIELD: '[ng-model=\'config.titleColumn\']',
    DESCRIPTION_COLUMN: '[ng-model=\'config.descColumn\']',
    TAGS_COLUMN: '[ng-model=\'config.tagsColumn\']',
    TAGS: '[name=\'tags\']',
    MERGE_AREAS_CHECKBOX: '[name=\'merge\']'
  },
  PREV_BUTTON: '[title=\'Previous step\']',
  NEXT_BUTTON: '[title=\'Next step\']',
  DONE_BUTTON: '[ng-click=\'wiz.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'wiz.cancel()\']'
};

exports.importGeoJSONDialog = {
  DIALOG: '[label=\'Import GeoJSON\']',
  DIALOG_HEADER: '[title=\'Import GeoJSON\']',
  DIALOG_CLOSE: '[label=\'Import GeoJSON\'] .close',
  timeTab: {
    // TODO: Finish adding selectors
  },
  optionsTab: {
    // TODO: Finish adding selectors
  },
  PREV_BUTTON: '[title=\'Previous step\']',
  NEXT_BUTTON: '[title=\'Next step\']',
  DONE_BUTTON: '[ng-click=\'wiz.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'wiz.cancel()\']'
};

exports.importKMLDialog = {
  DIALOG: '[label=\'Import KML\']',
  DIALOG_HEADER: '[title=\'Import KML\']',
  DIALOG_CLOSE: '[label=\'Import KML\'] .close',
  LAYER_TITLE_FIELD: '[name=\'title\']',
  DESCRIPTION_FIELD: '[name=\'desc\']',
  TAGS_FIELD: '[name=\'tags\']',
  COLOR_PICKER: '[name=\'color\']',
  OK_BUTTON: '[title=\'Import the file\']',
  CANCEL_BUTTON: '[title=\'Cancel file import\']'
};

exports.importStateDialog = {
  DIALOG: '[label=\'Import State\']',
  DIALOG_HEADER: '[title=\'Import State\']',
  DIALOG_CLOSE: '[title=\'Import State\'] .close',
  NAME_FIELD: '[name=\'title\']',
  DESCRIPTION_FIELD: '[name=\'desc\']',
  TAGS_FIELD: '[name=\'tags\']',
  CLEAR_CHECKBOX: '[name=\'clear\']',
  Choose: {
    CHECKBOX: '[name=\'showOptions\']',
    ALL_CHECKBOX: '[name=\'all\']',
    CURRENT_VIEW_CHECKBOX: '[title=\'Sets the current map view/position\'] [type=\'checkbox\']',
    DATA_LAYERS_CHECKBOX: '[title=\'Sets the current layers\'] [type=\'checkbox\']',
    EXCLUSION_AREAS: '[title=\'Sets the current exclusion areas\'] [type=\'checkbox\']',
    FEATURE_ACTIONS_CHECKBOX: '[title=\'Sets the current Feature Actions\'] [type=\'checkbox\']',
    FILTERS_CHECKBOX: '[title=\'Sets the current filters\'] [type=\'checkbox\']',
    QUERY_AREAS_CHECKBOX: '[title=\'Sets the current query areas\'] [type=\'checkbox\']',
    QUERY_ENTRIES_CHECKBOX: '[title=\'Sets the query combinations\'] [type=\'checkbox\']',
    TIME_CHECKBOX: '[title=\'Sets the current timeline\'] [type=\'checkbox\']'
  },
  OK_BUTTON: '[ng-click=\'stateForm.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'stateForm.close()\']'
};

exports.shpImportDialog = {
  DIALOG: '[label=\'SHP Import\']',
  DIALOG_HEADER: '[title=\'SHP Import\']',
  DIALOG_CLOSE: '[label=\'SHP Import\'] .close',
  timeTab: {
    // TODO: Finish adding selectors
  },
  optionsTab: {
    // TODO: Finish adding selectors
  },
  PREV_BUTTON: '[title=\'Previous step\']',
  NEXT_BUTTON: '[title=\'Next step\']',
  DONE_BUTTON: '[ng-click=\'wiz.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'wiz.cancel()\']'
};

exports.featureActionsDialog = {
  DIALOG: ':contains(\'Feature Actions\').modal',
  DIALOG_HEADER: ':contains("Feature Actions").modal-header',
  DIALOG_CLOSE: ':contains("Feature Actions")>.close',
  EXPORT_BUTTON: '[ng-click=\'ctrl.launchExport()\']',
  IMPORT_BUTTON: '[ng-click=\'ctrl.launchImport()\']',
  APPLY_BUTTON: '[ng-click=\'ctrl.apply()\']',
  CLOSE_BUTTON: '[ng-click=\'ctrl.close()\']'
};

// TODO: Much of this dialog still needs selectors
exports.advancedDialog = {
  DIALOG: '[label=\'Advanced\']',
  DIALOG_HEADER: '[title=\'Advanced\']',
  DIALOG_CLOSE: '[label=\'Advanced\'] .close',
  ADVANCED_CHECKBOX: '[title=\'Advanced mode allows more specific combinations of layers, filters, and areas\'] input',
  EXPORT_BUTTON: '[ng-click=\'comboCtrl.launchExport()\']',
  Import: {
    BUTTON: '[ng-click=\'comboCtrl.launchExport()\']',
    Dropdown: {
      BUTTON: '[ng-click=\'comboCtrl.openImportMenu()\']',
      IMPORT_FILE_URL: '[title=\'Import areas from a file or URL\']',
      ENTER_COORDINATES: '[title=\'Enter coordinates to load data for a box, circle, or polygon\']',
      WHOLE_WORLD: '[title=\'Load data for the whole world\']'
    }
  },
  APPLY_BUTTON: '[ng-click=\'comboCtrl.apply()\']',
  CLOSE_BUTTON: '[ng-click=\'comboCtrl.close()\']'
};
