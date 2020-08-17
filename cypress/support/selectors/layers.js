exports.Dialog = {
  DIALOG: '[label=Layers]',
  DIALOG_HEADER: '.js-window__header',
  DIALOG_TIPS: '[title=\'Show help\']',
  DIALOG_CLOSE: '[label=Layers] .close',
  ACTIVE_TAB: '.active.nav-link'
};

exports.layersTab = {
  TAB: '[tab=\'layers\'] .nav-link:eq(0)',
  GROUP_BY_DROPDOWN: '[ng-change=\'layers.onGroupByChanged()\']',
  addData: {
    BUTTON: '[label=\'Layers\'] [title=\'Add data to the map\']',
    Menu: {
      BUTTON: '[label=\'Layers\'] .dropdown-toggle',
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
  SEARCH_INPUT: '[placeholder=\'Search active layers\']',
  CLEAR_BUTTON: '[title=\'Clear the search term\']',
  TILE_LAYERS_TOGGLE_BUTTON: '[title=\'Toggle Tile Layers\']',
  FEATURE_LAYERS_TOGGLE_BUTTON: '[title=\'Toggle Feature Layers\']',
  Tree: {
    LOADING_SPINNER: '[title=\'Loading...\']',
    FEATURE_COUNT_TEXT: 'span:eq(8)',
    STREET_MAP_TILES: ':contains(\'Street Map Tiles\').slick-row',
    WORLD_IMAGERY_TILES: ':contains(\'World Imagery Tiles\').slick-row',
    Buttons: {
      CREATE_A_NEW_FOLDER_BUTTON: '[title=\'Create a new folder\']',
      CREATE_A_NEW_SAVED_PLACE_BUTTON: '[title=\'Create a new place\']',
      CREATE_A_NEW_ANNOTATION_BUTTON: '[title=\'Create a new annotation\']',
      EDIT_PLACE_BUTTON: '[title=\'Edit the place\']',
      EDIT_TRACK_BUTTON: '[title=\'Edit the place\']',
      MANAGE_FILTERS_BUTTON: '[title=\'Manage filters\']',
      REMOVE_FEATURE_BUTTON: '[title=\'Remove the feature\']',
      REMOVE_LAYER_BUTTON: '[title=\'Remove the layer\']',
      SAVE_BUTTON: '[title=\'Save\']'
    },
    contextMenu: {
      PANEL: '#menu',
      ADD_FOLDER: '[title=\'Creates a new folder and adds it to the tree\']',
      ADD_PLACE: '[title=\'Creates a new saved place\']',
      ADD_TO_TIMELINE: '[title=\'Enables layer animation when the timeline is open\']',
      ADD_TO_TRACK: '[title=\'Adds selected features (or all features if none are selected) ' +
      'to an existing track.\']',
      CLEAR_SELECTION: '[title=\'Clears the selection for the layer\']',
      CREATE_BUFFER_REGION: '[title=\'Create buffer regions around loaded data\']',
      CREATE_TRACK: '[title=\'Creates a new track by linking selected features (or all ' +
      'features if none are selected) in time order.\']',
      DESELECT: '[title=\'Deselect features in this area\']',
      DISABLE_AREA: '[title=\'Disable the area\']',
      DISABLE_TRACK_INTERPOLATION: '[title=\'Only move track marker when there is a supporting feature.\']',
      EDIT_AREA_DETAILS: '[title=\'Edit area information such as title/description\']',
      EDIT_PARAMETERS: '[title=\'Edit request parameters for the layer\']',
      EDIT_PLACE: '[title=\'Edit the saved place\']',
      ENABLE_AREA: '[title=\'Enable the area\']',
      ENABLE_TRACK_INTERPOLATION: '[title=\'Show the interpolated position of the track marker.\']',
      EXPORT_HEATMAP: '[title=\'Exports the heatmap as a KML Ground Overlay\']',
      EXPORT: '[evt-type=\'export\']',
      EXPORT_PLACES: '[title=\'Exports Saved Places from the selected location\']',
      FEATURE_ACTIONS: '[title=\'Perform actions on imported data matching a filter\']',
      FEATURE_INFO: '[title=\'Display detailed feature information\']',
      FOLLOW_TRACK: '[title=\'Follow the track as it animates.\']',
      GENERATE_HEATMAP: '[title=\'Generate a heatmap of current features\']',
      GO_TO: '[title=\'Repositions the map to show the layer\']',
      HIDE_TRACK_LINE: '[title=\'Do not show the track line.\']',
      IDENTIFY: '[title=\'Identifies a layer on the map\']',
      LOCK: '[title=\'Lock the layer to prevent data from changing\']',
      MERGE: '[title=\'Merge selected areas into a new area\']',
      MODIFY_AREA: '[title=\'Modify the area\']',
      MOST_RECENT: '[title=\'Adjusts application time to show the most recent data for the layer\']',
      REFRESH: '[title=\'Refreshes the layer\']',
      REMOVE: '[title=\'Removes the layer\']',
      REMOVE_ALL: '[title=\'Removes all of the places\']',
      REMOVE_AREA: '#menu [title=\'Remove the area\']',
      REMOVE_FEATURES_IN_AREA: '[title=\'Remove features in this area from the map\']',
      REMOVE_FROM_TIMELINE: '[title=\'Disables layer animation when the timeline is open\']',
      RENAME: '[title=\'Rename the layer\']',
      SAVE_TO_PLACES: '[evt-type=\'places:saveToPlaces\']',
      SELECT: '[title=\'Select features in this area\']',
      SELECT_EXCLUSIVE: '[title=\'Select only features in this area, deselecting features ' +
      'outside of the area\']',
      SHOW_DESCRIPTION: '[title=\'Gives details about the layer\']',
      SHOW_FEATURES: '[title=\'Displays features in the layer\']',
      SHOW_TRACK_LINE: '[title=\'Show the track line.\']',
      UNLOCK: '[title=\'Unlock the layer and refresh its data\']',
      UNFOLLOW_TRACK: '[title=\'Cancel following the track during animation.\']',
      ZOOM: '[title=\'Zoom the map to the feature(s)\']',
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
      },
      Query: {
        LOAD: '[title=\'Clear queries, then query for this area for all layers\']',
        ADD: '[title=\'Add a query for this area for all layers\']',
        chooseLayers: {
          TOP_LEVEL: ':contains(\'Copy\').ui-menu-item:eq(0)',
          FEATURES: '[title=\'Query area for layes of type (Features)\']',
          CUSTOM: '[evt-type=\'add:custom\']'
        }
      },
      Exclude: {
        SET: '[title=\'Clear exclusions, then add an exclusion area for all layers\']',
        ADD: '[title=\'Add an exclusion area for all layers\']',
        chooseLayers: {
          TOP_LEVEL: ':contains(\'Copy\').ui-menu-item:eq(1)',
          FEATURES: '[title=\'Exclude area for layes of type (Features)\']',
          CUSTOM: '[evt-type=\'add_exclude:custom\']'
        }
      }
    }
  },
  Accordion: {
    Style: {
      BRIGHTNESS_SLIDER: '[name=\'brightness\'] .ui-slider-handle',
      BRIGHTNESS_RESET_BUTTON: '[title=\'Restore default brightness\']',
      COLORIZE_CHECKBOX: '#tile_colorize',
      COLORS_DROPDOWN: '[title=\'Sets the color algorithm for the layer(s)\']',
      CONTRAST_SLIDER: '[name=\'contrast\'] .ui-slider-handle',
      CONTRAST_RESET_BUTTON: '[title=\'Restore default contrast\']',
      INTENSITY_DROPDOWN: '[name=\'intensity\'] .spinner',
      INTENSITY_SLIDER: '[name=\'intensity\'] .ui-slider-handle',
      OPACITY_RESET_BUTTON: '[title=\'Restore default opacity\']',
      SATURATION_SLIDER: '[name=\'saturation\'] .ui-slider-handle',
      SATURATION_RESET_BUTTON: '[title=\'Restore default saturation\']'
    },
    Options: {
      BUTTON: '[title=\'Configure the layer options\']',
      AUTO_REFRESH_DROPDOWN: '[ng-model=\'vector.refresh\']',
      UNIQUE_IDENTIFIER_DROPDOWN: '[ng-model=\'vector.uniqueId\']',
      ALTITUDE_MODE: '[title=\'Sets how the layer interprets altitude in 3D mode.\']',
      LOCK_LAYER_CHECKBOX: '#lockLayer'
    },
    Zoom: {
      BUTTON: '[title=\'Zoom controls for the layer(s)\']',
      MIN_ZOOM_SPINNER: '[name=\'minZoom\']',
      MIN_ZOOM_CURRENT_BUTTON: '[title=\'Sets the min zoom to the current zoom level\']',
      MAX_ZOON_SPINNER: '[name=\'maxZoom\']',
      MAX_ZOOM_CURRENT_BUTTON: '[title=\'Sets the max zoom to the current zoom level\']'
    }
  }
};

exports.areasTab = {
  TAB: '[tab=\'layers\'] .nav-link:eq(1)',
  GROUP_BY_DROPDOWN: '[ng-model=\'view\']',
  SEARCH_INPUT: '[placeholder=\'Search areas\']',
  CLEAR_BUTTON: '[title=\'Clear the search term\']',
  Tree: {
    SAVE_AREA_BUTTON: '[ng-click=\'nodeUi.edit()\']',
    REMOVE_AREA_BUTTON: '[title=\'Remove the area\']',
    TEMP_AREA_1: ':contains(\'temp area 1\')',
    TEMP_AREA_2: ':contains(\'temp area 2\')',
    TEMP_AREA_3: ':contains(\'temp area 3\')',
    TEMP_AREA_4: ':contains(\'temp area 4\')',
    TEMP_AREA_5: ':contains(\'temp area 5\')',
    WHOLE_WORLD_AREA: ':contains(\'Whole World\') .slick-cell',
    contextMenu: {
      PANEL: '#menu',
      Query: {
        LOAD: '[title=\'Clear queries, then query for this area for all layers\']',
        ADD: '[title=\'Add a query for this area for all layers\']',
        chooseLayers: {
          TOP_LEVEL: ':contains(\'Copy\').ui-menu-item:eq(0)',
          FEATURES: '[title=\'Query area for layes of type (Features)\']',
          CUSTOM: '[evt-type=\'add:custom\']'
        }
      },
      Exclude: {
        SET: '[title=\'Clear exclusions, then add an exclusion area for all layers\']',
        ADD: '[title=\'Add an exclusion area for all layers\']',
        chooseLayers: {
          TOP_LEVEL: ':contains(\'Copy\').ui-menu-item:eq(1)',
          FEATURES: '[title=\'Exclude area for layes of type (Features)\']',
          CUSTOM: '[evt-type=\'add_exclude:custom\']'
        }
      },
      SELECT: '[title=\'Select features in this area\']',
      SELECT_EXCLUSIVE: '[title=\'Select only features in this area, deselecting features outside of the area\']',
      DESELECT: '[title=\'Deselect features in this area\']',
      REMOVE_FEATURES_IN_AREA: '[title=\'Remove features in this area from the map\']',
      CREATE_BUFFER_REGION: '[title=\'Create a buffer region from the feature(s)\']',
      MODIFY_AREA: '[title=\'Modify the area\']',
      SAVE_TO_PLACES: '[title=\'Creates a new saved place from the area\']',
      ZOOM: '[title=\'Zoom the map to the feature(s)\']',
      EDIT_AREA_DETAILS: '[title=\'Edit area information such as title/description\']',
      ENABLE_AREA: '[title=\'Enable the area\']',
      DISABLE_AREA: '[title=\'Disable the area\']',
      EXPORT: '[title=\'Export the area\']',
      MERGE: '[title=\'Merge selected areas into a new area\']',
      REMOVE_AREA: '#menu [title=\'Remove the area\']'
    }
  },
  EXPORT_BUTTON: '[ng-click=\'areasCtrl.export()\']',
  Import: {
    BUTTON: '[ng-click=\'areasCtrl.import()\']',
    Menu: {
      BUTTON: '.fa-chevron-down',
      PANEL: '#menu',
      IMPORT_FILE_URL: '[title=\'Import areas from a file or URL\']',
      ENTER_COORDINATES: '[title=\'Enter coordinates to load data for a box, circle, or polygon\']',
      WHOLE_WORLD: '[title=\'Load data for the whole world\']'
    }
  },
  ADVANCED_BUTTON: '[ng-click=\'areasCtrl.launch()\']'
};

exports.filtersTab = {
  TAB: '[tab=\'layers\'] .nav-link:eq(2)',
  GROUP_BY_DROPDOWN: '[ng-change=\'filtersCtrl.onGroupChange()\']',
  ADD_FILTER_BUTTON: '[title=\'Add a filter\']',
  SEARCH_INPUT: '[placeholder=\'Search...\']',
  CLEAR_BUTTON: '[ng-change=\'filtersCtrl.onSearchTermChange()\']',
  Tree: {
    COPY_FILTER_BUTTON: '[title=\'Copy\']',
    EDIT_FILTER_BUTTON: '[title=\'Edit\']',
    REMOVE_FILTER_BUTTON: '[title=\'Remove\']',
    NEW_FILTER_1: ':contains(\'New Filter\'):eq(0)',
    NEW_FILTER_2: ':contains(\'New Filter\'):eq(1)',
    NEW_FILTER_3: ':contains(\'New Filter\'):eq(2)',
    contextMenu: {
      PANEL: '#menu',
      HIDE: '[title=\'Hides the filter\']',
      SHOW: '[title=\'Shows the filter\']',
      TURN_FILTER_ON: '[title=\'Apply the filter to all areas for the query\']',
      TURN_FILTER_OFF: '[title=\'Remove the filter from all areas for the query\']',
      REMOVE: '[title=\'Removes the filter\']',
      EXPORT_FILTER: '[title=\'Export the filter\']'
    }
  },
  EXPORT_BUTTON: '[ng-click=\'filtersCtrl.export()\']',
  IMPORT_BUTTON: '[ng-click=\'filtersCtrl.import()\']',
  ADVANCED_BUTTON: '[ng-click=\'filtersCtrl.launch()\']'
};

exports.placesTab = {
  TAB: '[tab=\'layers\'] .nav-link:eq(3)',
  ADD_FOLDER_BUTTON: '[ng-click=\'places.addFolder()\']',
  ADD_PLACE_BUTTON: '[ng-click=\'ctrl.addPlace()\']',
  EXPAND_ALL_BUTTON: '[title=\'Fully expand the tree from the selected item, or the root if nothing is selected\']',
  COLLAPSE_ALL_BUTTON: '[title=\'Fully collapse the tree from the selected item, or the root if ' +
  'nothing is selected\']',
  Tree: {
    Type: {
      Folder: {
        CREATE_FOLDER_BUTTON: '[title=\'Create a new folder\']',
        CREATE_PLACE_BUTTON: '[title=\'Create a new place\']',
        EDIT_BUTTON: '[title=\'Edit the folder\']',
        REMOVE_BUTTON: '[title=\'Remove the folder\']',
        contextMenu: {
          PANEL: '#menu',
          ADD_FOLDER: '[title=\'Creates a new folder and adds it to the tree\']',
          ADD_PLACE: '[title=\'Creates a new saved place\']',
          EDIT_FOLDER: '[title=\'Edit the folder label\']',
          EXPORT_PLACES: '[title=\'Exports Saved Places from the selected location\']',
          REMOVE_ALL: '[title=\'Removes everything under the folder\']'
        }
      },
      Place: {
        EDIT_BUTTON: '[title=\'Edit the place\']',
        REMOVE_BUTTON: '[ng-if=\'nodeUi.canRemove()\']',
        contextMenu: {
          PANEL: '#menu',
          CREATE_BUFFER_REGION: '[title=\'Creates buffer regions around loaded data\']',
          EDIT_PLACE: '[title=\'Edit the saved place\']',
          EXPORT_PLACES: '[title=\'Exports Saved Places from the selected location\']',
          REMOVE: '[title=\'Removes the place\']',
          FEATURE_INFO: '[title=\'Display detailed feature information\']',
          GO_TO: '[title=\'Repositions the map to display features at this level of the tree\']'
        }
      }
    }
  },
  EXPORT_BUTTON: '[title=\'Export places to KML\']',
  IMPORT_BUTTON: '[title=\'Import places only\']'
};
