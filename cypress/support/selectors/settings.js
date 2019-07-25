exports.settingsDialog = {
  DIALOG: '#settings',
  DIALOG_HEADER: '[title=\'Settings\']',
  DIALOG_CLOSE: '#settings .close',
  Tabs: {
    ACTIVE_TAB: '.selected',
    columnAssociations: {
      TAB: ':contains("Column Associations").slick-cell',
      PANEL: ':contains("Column Associations").container-fluid',
      CREATE_BUTTON: '[ng-click=\'cmCtrl.create()\']',
      EXPORT_BUTTON: '[ng-click=\'cmCtrl.export()\']',
      IMPORT_BUTTON: '[ng-click=\'cmCtrl.import()\']',
      Association: {
        NODE: '.js-node-toggle',
        NODE_EXPANDED_CLASS: 'fa-caret-down',
        NODE_COLLAPSED_CLASS: 'fa-caret-right',
        ROW: '[label=\'Settings\'] .container-fluid .slick-cell',
        EDIT_BUTTON: '[title=\'Edit the column mapping\']',
        REMOVE_BUTTON: '[title=\'Remove the column mapping\']',
        ROW_1: '[label=\'Settings\'] .container-fluid .slick-cell:eq(0)',
        ROW_1_EDIT_BUTTON: '[title=\'Edit the column mapping\']:eq(0)',
        ROW_1_REMOVE_BUTTON: '[title=\'Remove the column mapping\']:eq(0)',
        ROW_2: '[label=\'Settings\'] .container-fluid .slick-cell:eq(1)',
        ROW_2_EDIT_BUTTON: '[title=\'Edit the column mapping\']:eq(1)',
        ROW_2_REMOVE_BUTTON: '[title=\'Remove the column mapping\']:eq(1)',
        ROW_3: '[label=\'Settings\'] .container-fluid .slick-cell:eq(2)',
        ROW_3_EDIT_BUTTON: '[title=\'Edit the column mapping\']:eq(2)',
        ROW_3_REMOVE_BUTTON: '[title=\'Remove the column mapping\']:eq(2)'
      }
    },
    dataServers: {
      TAB: ':contains("Data Servers").slick-cell',
      PANEL: ':contains("Data Servers").container-fluid',
      ADD_SERVER_BUTTON: '[title=\'Add a new server\']',
      SERVER: '[ng-repeat=\'item in data\']',
      SERVER_CHECKBOX: '[ng-change=\'servers.update()\']',
      SERVER_ONLINE_BADGE: '[title=\'Online\']',
      SERVER_OFFLINE_BADGE: '[title=\'Offline\']',
      EDIT_SERVER_BUTTON: '[title=\'Edit server\']',
      DELETE_SERVER_BUTTON: '[title=\'Delete server\']',
      REFRESH_SERVER_BUTTON: '[title=\'Refresh server\']',
      SERVER_1: '[ng-repeat=\'item in data\']:eq(0)',
      SERVER_2: '[ng-repeat=\'item in data\']:eq(1)',
      SERVER_3: '[ng-repeat=\'item in data\']:eq(2)',
      SERVER_4: '[ng-repeat=\'item in data\']:eq(3)',
      SERVER_5: '[ng-repeat=\'item in data\']:eq(4)'
    },
    locationFormat: {
      TAB: ':contains("Location Format").slick-cell',
      PANEL: ':contains("Location Format").container-fluid',
      DEG_RADIO_BUTTON: '[title=\'Use DEG\']',
      DMS_RADIO_BUTTON: '[title=\'Use DMS\']',
      DDM_RADIO_BUTTON: '[title=\'Use DDM\']',
      MGRS_RADIO_BUTTON: '[title=\'Use MGRS\']'
    },
    Map: {
      TAB: ':contains("Map").slick-cell',
      PANEL: '[generic=\'defaultsettingui\']',
      Areas: {
        TAB: ':contains("Areas").slick-cell',
        PANEL: ':contains("Areas").container-fluid',
        includeOptions: {
          WIDTH_SLIDER: '[value=\'area.inWidth\']'
        },
        excludeOptions: {
          WIDTH_SLIDER: '[value=\'area.exWidth\']'
        },
        RESET_ALL_BUTTON: '[ng-click=\'area.reset()\']'
      },
      Bearing: {
        TAB: ':contains("Bearing").slick-cell',
        PANEL: ':contains("Bearing").container-fluid',
        TRUE_NORTH_RADIO_BUTTON: '#trueNorth',
        MAGNETIC_NORTH_RADIO_BUTTON: '#magnetic',
        CLICK_HERE_LINK: '[ng-if=\'helpUrl\'] a'
      },
      Display: {
        TAB: ':contains("Display").slick-cell',
        PANEL: ':contains("Display").container-fluid',
        mapMode: {
          FLAT_MAP_2D_RADIO_BUTTON: '#mapMode2D',
          GLOBE_3D_RADIO_BUTTON: '#mapMode3D'
        },
        Position: {
          DEFAULT_RADIO_BUTTON: '#cameraModeDefault',
          FIXED_RADIO_BUTTON: '#cameraModeFixed',
          REMEMBER_LAST_RADIO_BUTTON: '#cameraModeRemember',
          LATITUDE_TEXT: '[ng-if=\'display.cameraState\'] .col:eq(0)',
          LONGITUDE_TEXT: '[ng-if=\'display.cameraState\'] .col:eq(1)',
          ZOOM_TEXT: '[ng-if=\'display.cameraState\'] .col:eq(2)'
        },
        globeOptions: {
          ENABLE_SKY_CHECKBOX: '#skyEnabled',
          ENABLE_SKY_BADGE: '[content=\'display.help.sky\']',
          ENABLE_SUNLIGHT_CHECKBOX: '#sunlightEnabled',
          ENABLE_SUNLIGHT_BADGE: '[content=\'display.help.sunlight\']',
          ENABLE_FOG_CHECKBOX: '#fogEnabled',
          ENABLE_FOG_BADGE: '[content=\'display.help.fog\']',
          FOG_DENSITY_SLIDER: '.ui-slider-handle'
        }
      },
      Interpolation: {
        TAB: ':contains("Interpolation").slick-cell',
        PANEL: ':contains("Interpolation").container-fluid',
        GEODESIC_RADIO_BUTTON: '#geodesicInterpolation',
        RHUMB_RADIO_BUTTON: '#rhumbInterpolation',
        GRANULARITY_INPUT: '[name=\'kilometers\']'
      },
      Legend: {
        TAB: ':contains("Legend").slick-cell',
        PANEL: ':contains("Legend").container-fluid',
        OPEN_LEGEND_BUTTON: '[title=\'Open the legend on the map\']',
        contentOptions: {
          SHOW_FEATURE_LAYERS_CHECKBOX: '#legendShowVector',
          SHOW_FEATURE_LAYER_TYPE_CHECKBOX: '#legendShowVectorType',
          SHOW_FEATURE_COUNT_CHECKBOX: '#legendShowCount',
          SHOW_TILE_LAYERS_CHECKBOX: '#legendShowTile',
          SHOW_FEATURE_ACTIONS_CHECKBOX: '#legendShowFeatureActions',
          SHOW_AUTO_COLORS_CHECKBOX: '#legendShowAuto',
          SHOW_MANUAL_COLORS_CHECKBOX: '#legendShowManual',
          SHOW_COLUMN_IN_LABEL_CHECKBOX: '#legendShowColumn'
        },
        displayOptions: {
          SHOW_BACKGROUND_CHECKBOX: '#legendShowBackground',
          BOLD_TOGGLE_BUTTON: '[ng-click=\'legend.toggleBold()\']',
          DECREASE_FONT_BUTTON: '[ng-click=\'legend.decreaseFontSize()\']',
          INCREASE_FONT_BUTTON: '[ng-click=\'legend.increaseFontSize()\']',
          OPACITY_SLIDER: '.ui-slider-handle'
        }
      },
      Projection: {
        TAB: ':contains("Projection").slick-cell',
        PANEL: ':contains("Projection").container-fluid',
        MAP_PROJECTION_DROPDOWN: '[ng-model=\'projCtrl.projection\']',
        APPLY_BUTTON: '[ng-click=\'projCtrl.apply()\']'
      },
      Units: {
        TAB: ':contains("Units").slick-cell',
        PANEL: ':contains("Units").container-fluid',
        IMPERIAL_RADIO_BUTTON: '#imperial',
        METRIC_RADIO_BUTTON: '#metric',
        NAUTICAL_RADIO_BUTTON: '#metric',
        NAUTICAL_MILES_ONLY_RADIO_BUTTON: '#nauticalmile',
        MILES_ONLY_RADIO_BUTTON: '#mile',
        YARDS_ONLY_RADIO_BUTTON: '#yard',
        FEET_ONLY_RADIO_BUTTON: '#feet'
      }
    },
    Theme: {
      TAB: ':contains("Theme").slick-cell',
      PANEL: ':contains("Theme").container-fluid',
      PRIMARY_THEME_DROPDOWN: '[ng-change=\'ctrl.onThemeChange()\']',
      ACCESSIBILITY_OPTIONS_DROPDOWN: '[ng-model=\'ctrl.accessibleTheme\']'
    }
  },
  RESET_BUTTON: '[ng-click=\'setCon.reset();\']',
  CLOSE_BUTTON: '[ng-click=\'setCon.close()\']'
};
