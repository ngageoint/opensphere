exports.Application = {
  PAGE: 'body',
  HIDDEN_FILE_INPUT: 'input[type=\'file\']'
};

exports.Map = {
  CONTAINER: '#map-container',
  CANVAS_3D: '.webgl-canvas',
  CANVAS_2D: '.canvas:eq(0)',
  OVERVIEW_MAP: '.ol-overviewmap-map',
  OVERVIEW_MAP_TOGGLE_BUTTON: '[title=\'Overview map\']',
  ZOOM_IN_BUTTON: '.ol-zoom-in',
  ZOOM_OUT_BUTTON: '.ol-zoom-out',
  ROTATION_BUTTON: '.ol-rotate',
  MAP_MODE_BUTTON: '.ol-mapmode',
  ATTRIBUTION: '.ol-attribution',
  contextMenu: {
    PANEL: '#menu',
    RESET_VIEW: '[title=\'Resets to the default view\']',
    RESET_ROTATION: '[title=\'Resets to the default rotation\']',
    TOGGLE_2D_3D_VIEW: '[title=\'Toggle the map view between 2D and 3D views\']',
    SHOW_LEGEND: '[title=\'Display the map legend\']',
    CLEAR_SELECTION: '[title=\'Clears the selected features across all layers\']',
    BACKGROUND_COLOR: '[title=\'Change the map background color\']',
    Sky: {
      OPTION: '[title=\'Show the sky/stars around the 3D globe\']',
      IS_ACTIVE_CLASS: '[title=\'Show the sky/stars around the 3D globe\'] .fa-check-square-o',
      IS_INACTIVE_CLASS: '[title=\'Show the sky/stars around the 3D globe\'] .fa-square-o'
    },
    Sunlight: {
      OPTION: '[title=\'Light the 3D globe with the Sun\']',
      IS_ACTIVE_CLASS: '[title=\'Light the 3D globe with the Sun\'] .fa-check-square-o',
      IS_INACTIVE_CLASS: '[title=\'Light the 3D globe with the Sun\'] .fa-square-o'
    },
    COPY_COORDINATES: '[title=\'Copy coordinates to clipboard\']',
    CREATE_BUFFER_REGION: '[title=\'Create a buffer region around the clicked coordinate\']',
    SUN_MOON_INFO: '[title=\'See sun/moon event times for this location\']',
    SAVE_TO_PLACES: '[title=\'Creates a new saved place from this location\']',
    CREATE_ANNOTATION: '[title=\'Creates a new annotation at this location\']'
  }
};

exports.statusBar = {
  PANEL: '.o-navbottom',
  ALTITUDE_TEXT: '.altitude-text',
  ZOOM_TEXT: '.zoom-text',
  Scale: {
    BAR: '.ol-scale-line',
    Menu: {
      PANEL: '#menu',
      IMPERIAL: '[title=\'Switches to Imperial\']',
      METRIC: '[title=\'Switches to Metric\']',
      NAUTICAL: '[title=\'Switches to Nautical\']',
      NAUTICAL_MILES_ONLY: '[title=\'Switches to Nautical Miles Only\']',
      MILES_ONLY: '[title=\'Switches to Miles Only\']',
      YARDS_ONLY: '[title=\'Switches to Yards Only\']',
      FEET_ONLY: '[title=\'Switches to Feet Only\']'
    }
  },
  COORDINATES_TEXT: '.ol-mouse-position',
  SETTINGS_BUTTON: '[title=\'View Settings\']',
  LEGEND_BUTTON: '[title=\'View Legend\']',
  SERVERS_BUTTON: '[title=Servers]',
  ALERTS_BUTTON: '[title=Alerts]',
  ALERTS_UNREAD_BADGE: '[title=Alerts] .badge',
  HISTORY_BUTTON: '[title=History]',
  Mute: {
    BUTTON: '.fa-volume-off, .fa-volume-up',
    SOUND_ON_CLASS: 'fa-volume-up',
    SOUND_OFF_CLASS: 'fa-volume-off'
  }
};

exports.Timeline = {
  PANEL: '[ng-if=\'mainCtrl.timeline\']',
  VIEW_WINDOW: '.extent:eq(0)',
  HISTOGRAM_POINTS: '.c-histogram-group__line-point',
  START_DATE_TIME_TEXT: '.order-0',
  PREV_BUTTON: '[title=\'Previous frame\']',
  PLAY_BUTTON: '[title=\'Toggle animation of tiles/features on the map\']',
  NEXT_BUTTON: '[title=\'Next frame\']',
  PAUSE_BUTTON: '[title=\'Toggle animation of tiles/features on the map\']',
  RECORD_BUTTON: '#timeline-record-button',
  END_DATE_TIME_TEXT: '.order-md-2'
};

exports.Toolbar = {
  PANEL: '.o-navtop',
  addData: {
    BUTTON: '#addDataButton',
    OPEN_FILE_BUTTON: '[title=\'Open a file or URL\']',
    Menu: {
      BUTTON: '.o-add-data-button .dropdown-toggle',
      PANEL: '#menu',
      ADD_DATA: '[title=\'Browse the data catalog\']',
      OPEN_FILE_OR_URL: '[title=\'Import data from a local file or a URL\']',
      ADD_CESIUM_ION_ASSET: '[title=\'Loads a Cesium Ion asset in 3D mode\']',
      RECENT_STREET_MAP: ':contains(\'Street Map (Map)\').text-truncate',
      RECENT_WORLD_IMAGERY: ':contains(\'World Imagery (Map)\').text-truncate'
    },
    Recent: {
      DATA: '[role=\'menuitem\']',
      DATA_1: '[role=\'menuitem\']:eq(3)',
      DATA_2: '[role=\'menuitem\']:eq(4)',
      DATA_3: '[role=\'menuitem\']:eq(5)',
      DATA_4: '[role=\'menuitem\']:eq(6)',
      DATA_5: '[role=\'menuitem\']:eq(7)'
    }
  },
  LAYERS_TOGGLE_BUTTON: '[title=\'View Layers\']',
  Drawing: {
    BUTTON: '[title=\'Draws a box on the map for queries, zoom, and selection\']',
    BUTTON_IS_ACTIVE_CLASS: 'active',
    Menu: {
      BUTTON: '[ng-click=\'drawControls.toggleMenu()\']',
      PANEL: '#menu',
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
    BUTTON_IS_ACTIVE_CLASS: 'active',
    Menu: {
      BUTTON: '.btn-secondary.dropdown-toggle-split[ng-click=\'ctrl.openMenu()\']',
      PANEL: '#menu',
      MEASURE_GEODESIC: '[title=\'Measures the shortest distance between two points (variable bearing).\']',
      MEASURE_RHUMB_LINE: '[title=\'Measures the path of constant bearing between two points.\']'
    }
  },
  CLEAR_BUTTON: '[title=\'Select items to clear/reset\']',
  PREVIOUS_DAY_BUTTON: '[title=\'Previous day\']',
  Date: {
    INPUT: '[placeholder=Date]',
    Calendar: {
      PANEL: '#ui-datepicker-div',
      MONTH_DROPDOWN: '.ui-datepicker-month',
      YEAR_DROPDOWN: '.ui-datepicker-year',
      CURRENT_DAY: '.ui-state-active',
      TODAY_BUTTON: '.ui-datepicker-current',
      CLOSE_BUTTON: '.ui-datepicker-close'
    }
  },
  NEXT_DAY_BUTTON: '[title=\'Next day\']',
  DURATION_DROPDOWN: '[title=Duration]',
  timeFilter: {
    BUTTON: '[title=\'Show/hide time filter panel\']',
    BUTTON_IS_ACTIVE_CLASS: 'btn-info',
    PANEL: '.c-date-panel__extended',
    START_HOUR_INPUT: '[ng-model=\'ctrl.startHour\']',
    START_MINUTE_INPUT: '[ng-model=\'ctrl.startMinute\']',
    END_HOUR_INPUT: '[ng-model=\'ctrl.endHour\']',
    END_MINUTE_INPUT: '[ng-model=\'ctrl.endMinute\']',
    APPLY_BUTTON: '[title=\'Apply time slice\']'
  },
  TIMELINE_TOGGLE_BUTTON: '#timelineButton',
  Save: {
    Menu: {
      BUTTON: '[title=\'Save options\']',
      PANEL: '#menu',
      STATE: '[title=\'Save the application state\']',
      SCREENSHOT: '[title=\'Save a screenshot\']'
    }
  },
  States: {
    Menu: {
      BUTTON: '[title=\'State options\']',
      PANEL: '#menu',
      IMPORT_STATE: '[title=\'Import a state from a local file or a URL\']',
      SAVE_STATE: '[title=\'Save the application state\']',
      DISABLE_STATES: '[title=\'Disable all active application states\']'
    }
  },
  Search: {
    Menu: {
      BUTTON: '.c-search-box__dropdown',
      PANEL: '.js-searchbox__search-options',
      searchTypes: {
        ALL_BUTTON: '[ng-click=\'searchBox.toggleAll(true)\']',
        NONE_BUTTON: '[ng-click=\'searchBox.toggleAll(false)\']',
        COORDINATES_CHECKBOX: ':contains(\'Coordinates\') .dropdown-item',
        LAYERS_CHECKBOX: ':contains(\'Layers\') .dropdown-item'
      },
      recentSearches: {
        SEARCH: '[ng-repeat=\'recent in searchBox.recentSearches\']',
        SEARCH_1: '[ng-repeat=\'recent in searchBox.recentSearches\']:eq:(0)',
        SEARCH_2: '[ng-repeat=\'recent in searchBox.recentSearches\']:eq:(1)',
        SEARCH_3: '[ng-repeat=\'recent in searchBox.recentSearches\']:eq:(2)',
        SEARCH_4: '[ng-repeat=\'recent in searchBox.recentSearches\']:eq:(3)',
        SEARCH_5: '[ng-repeat=\'recent in searchBox.recentSearches\']:eq:(4)'
      }
    },
    Results: {
      PANEL: '.c-searchresults',
      resultCard: {
        PANEL: '.card',
        HEADER: '.card-header',
        SUBTITLE: '.card-subtitle',
        BODY: '.card-body',
        REMOVE_BUTTON: '.card :contains(\'Remove\') > button',
        ADD_BUTTON: '.card :contains(\'Add\') > button',
        GO_TO_BUTTON: '.card [title=\'View the result on the map\']'
      },
      resultCard1: {
        PANEL: '.card:eq(0)',
        HEADER: '.card-header:eq(0)',
        SUBTITLE: '.card-subtitle:eq(0)',
        BODY: '.card-body:eq(0)',
        REMOVE_BUTTON: '.card:eq(0) :contains(\'Remove\') > button',
        ADD_BUTTON: '.card:eq(0) :contains(\'Add\') > button',
        GO_TO_BUTTON: '.card:eq(0) [title=\'View the result on the map\']'
      },
      resultCard2: {
        PANEL: '.card:eq(1)',
        HEADER: '.card-header:eq(1)',
        SUBTITLE: '.card-subtitle:eq(1)',
        BODY: '.card-body:eq(1)',
        REMOVE_BUTTON: '.card:eq(1) :contains(\'Remove\') > button',
        ADD_BUTTON: '.card:eq(1) :contains(\'Add\') > button',
        GO_TO_BUTTON: '.card:eq(1) [title=\'View the result on the map\']'
      },
      resultCard3: {
        PANEL: '.card:eq(2)',
        HEADER: '.card-header:eq(2)',
        SUBTITLE: '.card-subtitle:eq(2)',
        BODY: '.card-body:eq(2)',
        REMOVE_BUTTON: '.card:eq(2) :contains(\'Remove\') > button',
        ADD_BUTTON: '.card:eq(2) :contains(\'Add\') > button',
        GO_TO_BUTTON: '.card:eq(2) [title=\'View the result on the map\']'
      },
      resultCard4: {
        PANEL: '.card:eq(3)',
        HEADER: '.card-header:eq(3)',
        SUBTITLE: '.card-subtitle:eq(3)',
        BODY: '.card-body:eq(3)',
        REMOVE_BUTTON: '.card:eq(3) :contains(\'Remove\') > button',
        ADD_BUTTON: '.card:eq(3) :contains(\'Add\') > button',
        GO_TO_BUTTON: '.card:eq(3) [title=\'View the result on the map\']'
      },
      resultCard5: {
        PANEL: '.card:eq(4)',
        HEADER: '.card-header:eq(4)',
        SUBTITLE: '.card-subtitle:eq(4)',
        BODY: '.card-body:eq(4)',
        REMOVE_BUTTON: '.card:eq(4) :contains(\'Remove\') > button',
        ADD_BUTTON: '.card:eq(4) :contains(\'Add\') > button',
        GO_TO_BUTTON: '.card:eq(4) [title=\'View the result on the map\']'
      }
    },
    INPUT: '.c-search-box__input',
    CLEAR_BUTTON: '[title=\'Clear search\']',
    BUTTON: '[type=submit]'
  },
  Support: {
    Menu: {
      BUTTON: '[title=Support]',
      PANEL: '#menu',
      ABOUT: '[title=\'About OpenSphere\']',
      CONTROLS: '[title=\'Keyboard and mouse controls\']',
      SHOW_TIPS: '[title=\'Reset help tips, and show the initial set of tips\']',
      OPENSPHERE_CAPABILITIES: '[title=\'Display the OpenSphere Capabilities\']',
      VIEW_ALERTS: '[title=\'Display the alert log\']',
      VIEW_LOG: '[title=\'Display the application log\']',
      RESET_SETTINGS: '[evt-type=\'displayClearLocalStorage\']'
    }
  }
};
