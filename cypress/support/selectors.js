exports.aboutDialog = {
  DIALOG: '#aboutModal',
  DIALOG_HEADER: '[title=\'About\']',
  DIALOG_CLOSE: '#aboutModal .close',
  CLOSE_BUTTON: '.btn[data-dismiss=\'modal\']'
};

exports.addArcServerDialog = {
  DIALOG: '[label=\'Add Arc Server\']',
  DIALOG_HEADER: '[title=\'Add Arc Server\']',
  DIALOG_CLOSE: '[label=\'Add Arc Server\'] .close',
  TITLE_INPUT: '[name=\'title\']',
  URL_INPUT: '[name=\'url\']',
  SAVE_BUTTON: '[ng-click=\'ctrl.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'ctrl.close()\']'
};

exports.addDataDialog = {
  DIALOG: '#addData',
  DIALOG_HEADER: '[title=\'Add Data\']',
  DIALOG_SHOW_HELP_BUTTON: '[title=\'Show help\']',
  DIALOG_CLOSE: '#addData .close',
  SEARCH_INPUT: '[placeholder=\'Search available layers\']',
  CLEAR_BUTTON: '[title=\'Clear the search term\']',
  GROUP_BY_DROPDOWN: '[ng-model=\'addData.view\']',
  MANAGE_SERVERS_BUTTON: '[title=\'Add, edit, and remove servers providing data to the application\']',
  OPEN_FILE_URL_BUTTON: '[title=\'Open a local file or URL\']',
  Tree: {
    LAYER_WILDCARD: '#addData .slick-row',
    LAYER_NODE_WILDCARD: '.js-node-toggle',
    LAYER_NODE_EXPANDED_WILDCARD_CLASS: 'fa-caret-down',
    LAYER_NODE_COLLAPSED_WILDCARD_CLASS: 'fa-caret-right',
    LAYER_TOGGLE_SWITCH_WILDCARD: '[title=\'Activates or deactivates the layer\']',
    LAYER_IS_ON_CLASS_WILDCARD: 'c-toggle-switch-on',
    LAYER_IS_OFF_CLASS_WILDCARD: 'c-toggle-switch-off',
    FILTER_BUTTON_WILDCARD: '[title=\'Manage filters\']',
    REMOVE_THE_FILE_BUTTON_WILDCARD: '[title=\'Remove the file\']',
    LAYER_1: '#addData .slick-row:eq(0)',
    LAYER_2: '#addData .slick-row:eq(1)',
    LAYER_3: '#addData .slick-row:eq(2)',
    LAYER_4: '#addData .slick-row:eq(3)',
    LAYER_5: '#addData .slick-row:eq(4)'
  },
  DESCRIPTION_PANEL: '[bind-directive=\'addData.getInfo()\']',
  CLOSE_BUTTON: '[ng-click=\'addData.close()\']'
};

exports.addExpressionDialog = {
  DIALOG: '#editfilter',
  DIALOG_HEADER: '[title=\'Edit Filter\']',
  DIALOG_CLOSE: '#editfilter .close',
  COLUMN_DROPDOWN: '[ng-model=\'expr.column\']',
  OPERATOR_DROPDOWN: '[ng-model=\'expr.op\']',
  EXPRESSION_INPUT: '[ng-model=\'expr.literal\']',
  OK_BUTTON: '[ng-click=\'filters.finish()\']',
  CANCEL_BUTTON: '[ng-click=\'filters.cancel()\']'
};

exports.addFolderDialog = {
  DIALOG: '[label=\'Add Folder\']',
  DIALOG_HEADER: '[title=\'Add Folder\']',
  DIALOG_CLOSE: '[label=\'Add Folder\'] .close',
  FOLDER_LABEL_INPUT: '[name=\'title\']',
  OK_BUTTON: '[ng-class=\'yesButtonClass\']',
  CANCEL_BUTTON: '[ng-class=\'noButtonClass\']'
};

exports.addGeoServerDialog = {
  DIALOG: '[label=\'Add GeoServer\']',
  DIALOG_HEADER: '[title=\'Add GeoServer\']',
  DIALOG_CLOSE: '[label=\'Add GeoServer\'] .close',
  TITLE_INPUT: '[name=\'title\']',
  URL_INPUT: '[name=\'url\']',
  SAVE_BUTTON: '[ng-click=\'ctrl.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'ctrl.close()\']'
};

exports.addPlaceDialog = {
  DIALOG: '#placemarkEdit',
  DIALOG_HEADER: '[title=\'Add Place\']',
  DIALOG_CLOSE: '#placemarkEdit .close',
  NAME_INPUT: '[name=\'name\']',
  DESCRIPTION_INPUT: '.CodeMirror',
  POSITION_INPUT: '[ng-model=\'posText\']',
  POSITION_BUTTON: '[title=\'Set the position by clicking on the map\']',
  ENTERING_POSITION_BADGE: '[data-title=\'"Entering Position"\']',
  ALTITUDE_INPUT: '[name=\'altitude\']',
  ALTITUDE_UNITS_DROPDOWN: '[ng-model=\'ctrl.altUnits\']',
  Time: {
    NO_TIME: '[value=\'notime\']',
    Instant: {
      RADIOBUTTON: '[value=\'instant\']',
      DATE_INPUT: '#placemarkEdit [ui-date=\'wheelDate.dateOptions\']',
      HOUR_INPUT: '[ng-model=\'dateTimeCtrl.hour\']',
      MINUTE_INPUT: '[ng-model=\'dateTimeCtrl.minute\']',
      SECONDS_INPUT: '[ng-model=\'dateTimeCtrl.second\']',
      NOW_BUTTON: '[ng-click=\'dateTimeCtrl.setNow()\']',
      CLEAR_BUTTON: '[ng-click=\'dateTimeCtrl.reset()\']'
    },
    RANGE: {
      RADIOBUTTON: '[value=\'range\']',
      Start: {
        DATE_INPUT: '#placemarkEdit [ui-date=\'wheelDate.dateOptions\']:eq(0)',
        HOUR_INPUT: '[ng-model=\'dateTimeCtrl.hour\']:eq(0)',
        MINUTE_INPUT: '[ng-model=\'dateTimeCtrl.minute\']:eq(0)',
        SECONDS_INPUT: '[ng-model=\'dateTimeCtrl.second\']:eq(0)',
        NOW_BUTTON: '[ng-click=\'dateTimeCtrl.setNow()\']:eq(0)',
        CLEAR_BUTTON: '[ng-click=\'dateTimeCtrl.reset()\']:eq(0)'
      },
      End: {
        DATE_INPUT: '#placemarkEdit [ui-date=\'wheelDate.dateOptions\']:eq(1)',
        HOUR_INPUT: '[ng-model=\'dateTimeCtrl.hour\']:eq(1)',
        MINUTE_INPUT: '[ng-model=\'dateTimeCtrl.minute\']:eq(1)',
        SECONDS_INPUT: '[ng-model=\'dateTimeCtrl.second\']:eq(1)',
        NOW_BUTTON: '[ng-click=\'dateTimeCtrl.setNow()\']:eq(1)',
        CLEAR_BUTTON: '[ng-click=\'dateTimeCtrl.reset()\']:eq(1)'
      }
    },
    TIME_SELECTION_BADGE: '[ng-if=\'help\']'
  },
  Accordion: {
    styleOptions: {
      BUTTON: '[title=\'Style controls for the layer(s)\']',
      OPACITY_SLIDER: '[name=\'opacity\'] .ui-slider-handle',
      SIZE_SLIDER: '[name=\'size\'] .ui-slider-handle',
      colorPicker: {
        BUTTON: '[title=\'Sets the color/shape used to render features\'] [color=\'color\']',
        SELECTED_COLOR: '.c-colorpalette__selected',
        Color: {
          WHITE: '[title=\'#ffffff\']',
          BLACK: '[title=\'#000000\']',
          RED: '[title=\'#FF0000\']',
          ORANGE: '[title=\'#FFA500\']',
          YELLOW: '[title=\'#FFFF00\']',
          GREEN: '[title=\'#008000\']',
          BLUE: '[title=\'#0000FF\']',
          INDIGO: '[title=\'#4B0082\']',
          VIOLET: '[title=\'#EE82EE\']'
        },
        RESET_BUTTON: '[ng-click=\'palette.reset()\']'
      },
      DROPDOWN: '[ng-model=\'$parent.shape\']',
      Style: {
        Icon: {
          ICON_BUTTON: '[ng-model=\'icon\']',
          ROTATION_INPUT: '[name=\'iconRotation\']',
          ICON_ROTATION_BADGE: '[data-title=\'"Icon Rotation"\']'
        },
        Ellipse: {
          SEMI_MAJOR_INPUT: '[name=\'semiMajor\']',
          SEMI_MAJOR_UNITS_DROPDOWN: '[ng-model=\'ctrl.semiMajorUnits\']',
          SEMI_MAJOR_AXIS_BADGE: '[data-title=\'"Semi-Major Axis"\']',
          SEMI_MINOR_INPUT: '[name=\'semiMinor\']',
          SEMI_MINOR_UNITS_DROPDOWN: '[ng-model=\'ctrl.semiMinorUnits\']',
          SEMI_MINOR_AXIS_BADGE: '[data-title=\'"Semi-Minor Axis"\']',
          ORIENTATION_INPUT: '[name=\'orientation\']',
          ELLIPSE_ORIENTATION_BADGE: '[data-title=\'"Ellipse Orientation"\']'
        },
        ellipseWithCenter: {
          SEMI_MAJOR_INPUT: '[name=\'semiMajor\']',
          SEMI_MAJOR_UNITS_DROPDOWN: '[ng-model=\'ctrl.semiMajorUnits\']',
          SEMI_MAJOR_AXIS_BADGE: '[data-title=\'"Semi-Major Axis"\']',
          SEMI_MINOR_INPUT: '[name=\'semiMinor\']',
          SEMI_MINOR_UNITS_DROPDOWN: '[ng-model=\'ctrl.semiMinorUnits\']',
          SEMI_MINOR_AXIS_BADGE: '[data-title=\'"Semi-Minor Axis"\']',
          ORIENTATION_INPUT: '[name=\'orientation\']',
          ELLIPSE_ORIENTATION_BADGE: '[data-title=\'"Ellipse Orientation"\']',
          CENTER_DROPDOWN: '[ng-change=\'ctrl.onCenterShapeChange($parent.centerShape)\']',
          ICON_BUTTON: '[ng-model=\'icon\']',
          ROTATION_INPUT: '[name=\'iconRotation\']',
          ICON_ROTATION_BADGE: '[data-title=\'"Icon Rotation"\']'
        }
      }
    },
    labelOptions: {
      Label: {
        BUTTON: '[title=\'Configure how labels are displayed for the layer\']',
        colorPicker: {
          BUTTON: '[title=\'Sets the color/shape used to render features\'] [color=\'color\']',
          SELECTED_COLOR: '.c-colorpalette__selected',
          Color: {
            WHITE: '[title=\'#ffffff\']',
            BLACK: '[title=\'#000000\']',
            RED: '[title=\'#FF0000\']',
            ORANGE: '[title=\'#FFA500\']',
            YELLOW: '[title=\'#FFFF00\']',
            GREEN: '[title=\'#008000\']',
            BLUE: '[title=\'#0000FF\']',
            INDIGO: '[title=\'#4B0082\']',
            VIOLET: '[title=\'#EE82EE\']'
          },
          RESET_BUTTON: '[ng-click=\'palette.reset()\']'
        },
        SIZE_DROPDOWN: '[name=\'spinner\']',
        ALWAYS_SHOW_LABELS_CHECKBOX: '#showLabels',
        Column: {
          HANDLE_WILDCARD: '[title=\'Click and Drag to move this label\']',
          CHECKBOX_WILDCARD: '[ng-model=\'label.showColumn\']',
          DROPDOWN_WILDCARD: '[title=\'Sets the data field used for labels\']',
          REMOVE_COLUMN_BUTTON_WILDCARD: '[title=\'Remove this label\']',
          ADD_COLUMN_BUTTON: '[title=\'Add a label\']',
          COLUMN_1_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
          COLUMN_1_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
          COLUMN_1_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
          COLUMN_2_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
          COLUMN_2_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
          COLUMN_2_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
          COLUMN_3_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
          COLUMN_3_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
          COLUMN_3_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
          COLUMN_4_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
          COLUMN_4_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
          COLUMN_4_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
          COLUMN_5_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
          COLUMN_5_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
          COLUMN_5_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)'
        }
      }
    },
    annotationOptions: {
      SHOW_ANNOTATION_CHECKBOX: '[ng-attr-for=\'showAnnotation{{ctrl.uid}}\']',
      SHOW_NAME_CHECKBOX: '[ng-attr-for=\'showAnnotationName{{ctrl.uid}}\']',
      SHOW_DESCRIPTION_CHECKBOX: '[ng-attr-for=\'showAnnotationDescription{{ctrl.uid}}\']',
      SHOW_DEFAULTTAILTYPE_RADIOBUTTON: '[ng-attr-for=\'showAnnotationDefaultTail{{ctrl.uid}}\']',
      SHOW_NOTAILTYPE_RADIOBUTTON: '[ng-attr-for=\'showAnnotationNoTail{{ctrl.uid}}\']',
      SHOW_LINETAILTYPE_RADIOBUTTON: '[ng-attr-for=\'showAnnotationLineTail{{ctrl.uid}}\']'
    }
  },
  OK_BUTTON: '[ng-class=\'yesButtonClass\']',
  CANCEL_BUTTON: '[ng-class=\'noButtonClass\']'
};

exports.advancedDialog = {
  DIALOG: '[label=\'Advanced\']',
  DIALOG_HEADER: '[title=\'Advanced\']',
  DIALOG_CLOSE: '[label=\'Advanced\'] .close',
  LAYER_DROPDOWN: '[ng-model=\'layer\']',
  GROUP_BY_DROPDOWN: '[ng-model=\'order\']',
  ADD_FILTER_BUTTON: '[label=\'Advanced\'] [title=\'Add a filter\']',
  ADVANCED_CHECKBOX: '[title=\'Advanced mode allows more specific combinations of layers, filters, and areas\'] input',
  EXPAND_ALL_BUTTON: '[title=\'Expand all\']',
  COLLAPSE_ALL_BUTTON: '[title=\'Collapse all\']',
  RESET_BUTTON: '[title=\'Clears all the checkboxes in the form\']',
  Tree: {
    LAYER_WILDCARD: '[label=\'Advanced\'] .slick-cell',
    LAYER_1: '[label=\'Advanced\'] .slick-cell:eq(0)',
    LAYER_2: '[label=\'Advanced\'] .slick-cell:eq(1)',
    LAYER_3: '[label=\'Advanced\'] .slick-cell:eq(2)',
    LAYER_4: '[label=\'Advanced\'] .slick-cell:eq(3)',
    LAYER_5: '[label=\'Advanced\'] .slick-cell:eq(4)',
    LAYER_NODE_WILDCARD: '.js-node-toggle',
    LAYER_NODE_EXPANDED_WILDCARD_CLASS: 'fa-caret-down',
    LAYER_NODE_COLLAPSED_WILDCARD_CLASS: 'fa-caret-right',
    LAYER_TOGGLE_SWITCH_WILDCARD: '[label=\'Advanced\'] .c-tristate',
    LAYER_IS_ON_CLASS_WILDCARD: '[label=\'Advanced\'] .c-tristate-off',
    LAYER_IS_OFF_CLASS_WILDCARD: '[label=\'Advanced\'] .c-tristate-on',
    OPERATOR_DROPDOWN_WILDCARD: '[title=\'Whether to pass all filters (AND) or any filter (OR)\']',
    QUERY_EXCLUDE_TOGGLE_BADGE_WILDCARD: '[title=\'Toggles between querying and excluding the area\']',
    EDIT_LAYER_BUTTON_WILDCARD: '[title=\'Edit\']',
    REMOVE_LAYER_BUTTON_WILDCARD: '[title=\'Remove\']'
  },
  EXPORT_BUTTON: '[ng-click=\'comboCtrl.launchExport()\']',
  Import: {
    BUTTON: '[ng-click=\'comboCtrl.launchExport()\']',
    Menu: {
      BUTTON: '[ng-click=\'comboCtrl.openImportMenu()\']',
      menuOptions: {
        IMPORT_FILE_URL: '[title=\'Import areas from a file or URL\']',
        ENTER_COORDINATES: '[title=\'Enter coordinates to load data for a box, circle, or polygon\']',
        WHOLE_WORLD: '[title=\'Load data for the whole world\']'
      }
    }
  },
  APPLY_BUTTON: '[ng-click=\'comboCtrl.apply()\']',
  CLOSE_BUTTON: '[ng-click=\'comboCtrl.close()\']'
};

exports.alertsDialog = {
  DIALOG: '#alerts',
  DIALOG_HEADER: '[title=\'Alerts\']',
  DIALOG_CLOSE: '#alerts .close',
  ALERT_WILDCARD: '.alert',
  SHOW_POPUPS_CHECKBOX: '#alerts__show-popups',
  CLEAR_ALERTS_BUTTON: '[title=\'Clear all alerts\']'
};

exports.Application = {
  PAGE: 'body',
  HIDDEN_FILE_INPUT: 'input[type=\'file\']'
};

exports.chooseAnIconDialog = {
  DIALOG: '#iconselector',
  DIALOG_HEADER: '[title=\'Choose an Icon\']',
  DIALOG_CLOSE: '#iconselector .close',
  Pins: {
    YELLOW_PUSHPIN: '[title=\'Yellow Push Pin\']',
    GREEN_PUSHPIN: '[title=\'Green Push Pin\']',
    WHITE_PUSHPIN: '[title=\'White Push Pin\']',
    ARROW: '[title=\'Arrow\']',
    CIRCLE: '[title=\'Circle\']',
    PLANE: '[title=\'Airports\']',
    BOAT: '[title=\'Ferry\']',
    CHOPPER: '[title=\'Heliport\']',
    HOSPITAL: '[title=\'Hospitals\']',
    CAUTION: '[title=\'Caution\']'
  },
  CURRENT_PIN: '.img-fluid',
  OK_BUTTON: '[ng-click=\'selector.okay()\']',
  CANCEL_BUTTON: '[ng-click=\'selector.okay()\']'
};

exports.chooseAreaDialog = {
  DIALOG: '[label=\'Choose Area\']',
  DIALOG_HEADER: '[title=\'Choose Area\']',
  AREA_DROPDOWN: '[ng-model=\'area\']',
  OK_BUTTON: '[ng-class=\'yesButtonClass\']',
  CANCEL_BUTTON: '[ng-click=\'confirm.cancel()\']'
};

exports.chooseATrackDialog = {
  DIALOG: '[label=\'Choose a Track\']',
  DIALOG_HEADER: '[title=\'Choose a Track\']',
  TRACK_DROPDOWN: '[ng-model=\'confirm.track\']',
  OK_BUTTON: '[ng-class=\'yesButtonClass\']',
  CANCEL_BUTTON: '[ng-class=\'noButtonClass\']'
};

exports.chooseTrackSortColumnDialog = {
  DIALOG: '[label=\'Choose Track Sort Column\']',
  DIALOG_HEADER: '[title=\'Choose Track Sort Column\']',
  TRACK_DROPDOWN: '[ng-model=\'confirm.column\']',
  OK_BUTTON: '[ng-class=\'yesButtonClass\']',
  CANCEL_BUTTON: '[ng-class=\'noButtonClass\']'
};

exports.clearDialog = {
  DIALOG: '#clear',
  DIALOG_HEADER: '[title=Clear]',
  DIALOG_CLOSE: '[label=Clear] .close',
  OK_BUTTON: '[ng-click=\'clear.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'clear.cancel()\']',
  Items: {
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

exports.copyCoordinatesDialog = {
  DIALOG: '#copyPosition',
  DIALOG_HEADER: '[title=\'Copy Coordinates\']',
  DIALOG_TEXT: '.container-fluid',
  OK_BUTTON: '[ng-click=\'copyPosition.close()\']'
};

exports.controlsDialog = {
  DIALOG: '#controlsHelp',
  DIALOG_HEADER: '[title=\'Controls\']',
  DIALOG_CLOSE: '#controlsHelp .close',
  DIALOG_TEXT: '#controlsHelp .js-window__wrapper'
};

exports.createBufferRegionDialog = {
  DIALOG: '#Buffer',
  DIALOG_HEADER: '[title=\'Create Buffer Region\']',
  DIALOG_CLOSE: '#Buffer .close',
  TITLE_INPUT: '[name=\'title\']',
  TITLE_BADGE: '[ng-if=\'help.title\']',
  DESCRIPTION_INPUT: '[name=\'description\']',
  DESCRIPTION_BADGE: '[ng-if=\'help.description\']',
  TAGS_INPUT: '[ng-model=\'config.tags\']',
  TAGS_BADGE: '[ng-if=\'help.tags\']',
  BUFFER_DISTANCE_INPUT: '[name=\'distance\']',
  BUFFER_DISTANCE_BADGE: '[x-content=\'buffer.help.distance\']',
  LIVE_PREVIEW_CHECKBOX: '[name=\'liveEnabled\']',
  LIVE_PREVIEW_BADGE: '[x-content=\'buffer.livePreviewContent\']',
  OK_BUTTON: '[ng-click=\'buffer.confirm()\']',
  CANCEL_BUTTON: '[ng-click=\'buffer.cancel()\']'
};

exports.createBufferRegionsDialog = {
  DIALOG: '#Buffer',
  DIALOG_HEADER: '[title=\'Create Buffer Regions\']',
  DIALOG_CLOSE: '#Buffer .close',
  TITLE_COLUMN_DROPDOWN: '[ng-model=\'config.titleColumn\']',
  TITLE_COLUMN_BADGE: '[ng-if=\'help.titleColumn\']',
  DESCRIPTION_COLUMN_DROPDOWN: '[ng-model=\'config.descColumn\']',
  DESCRIPTION_COLUMN_BADGE: '[ng-if=\'help.descColumn\']',
  DESCRIPTION_INPUT: '[name=\'description\']',
  DESCRIPTION_BADGE: '[ng-if=\'help.description\']',
  TAGS_COLUMN_DROPDOWN: '[ng-model=\'config.tagsColumn\']',
  TAGS_COLUMN_BADGE: '[ng-if=\'help.tagsColumn\']',
  TAGS_INPUT: '[name=\'tags\']',
  TAGS_BADGE: '[ng-if=\'help.tags\']',
  BUFFER_DISTANCE_INPUT: '[name=\'distance\']',
  BUFFER_DISTANCE_BADGE: '[x-title=\'"Buffer Distance"\']',
  DISTANCE_UNITS_DROPDOWN: '[name=\'units\']',
  DISTANCE_UNITS_BADGE: '[x-content=\'buffer.help.units\']',
  LIVE_PREVIEW_CHECKBOX: '[name=\'liveEnabled\']',
  LIVE_PREVIEW_BADGE: '[x-content=\'buffer.livePreviewContent\']',
  UPDATE_PREVIEW_BUTTON: '[ng-click=\'buffer.updatePreview(true)\']',
  USE_SELECTED_FEATURES_CHECKBOX: '[name=\'buffer.useSelected\']',
  SOURCE_CHECKBOX_WILDCARD: '[name=\'sourcelist\'] [name=\'items\']',
  OK_BUTTON: '[ng-click=\'buffer.confirm()\']',
  CANCEL_BUTTON: '[ng-click=\'buffer.cancel()\']'
};

exports.createColumnAssociationDialog = {
  DIALOG: '#columnmappingform',
  DIALOG_HEADER: '[title=\'Create Column Association\']',
  DIALOG_CLOSE: '#columnmappingform .close',
  NAME_INPUT: '[name=\'name\']',
  DESCRIPTION_INPUT: '[name=\'description\']',
  ADD_ASSOCIATION_BUTTON: '[ng-click=\'cmFormCtrl.add()\']',
  Associations: {
    LAYER_DROPDOWN_WILDCARD: '.select2-chosen',
    COLUMN_DROPDOWN_WILDCARD: '.select2-chosen',
    REMOVE_EXPRESSION_BUTTON_WILDCARD: '[title=\'Remove this expression\']',
    LAYER_1_DROPDOWN: '.select2-chosen:eq(0)',
    COLUMN_1_DROPDOWN: '.select2-chosen:eq(0)',
    EXPRESSION_1_REMOVE_BUTTON: '[title=\'Remove this expression\']:eq(0)',
    LAYER_2_DROPDOWN: '.select2-chosen:eq(1)',
    COLUMN_2_DROPDOWN: '.select2-chosen:eq(1)',
    EXPRESSION_2_REMOVE_BUTTON: '[title=\'Remove this expression\']:eq(1)'
  },
  OK_BUTTON: '[ng-click=\'cmFormCtrl.confirm()\']',
  CANCEL_BUTTON: '[ng-click=\'cmFormCtrl.cancel()\']'
};

exports.createFeatureActionDialog = {
  DIALOG: 'editfeatureaction',
  DIALOG_HEADER: '[title=\'Create Feature Action\']',
  DIALOG_CLOSE: '#editfeatureaction .close',
  TITLE_INPUT: '#filterTitle',
  DESCRIPTION_INPUT: '#filterDesc',
  TAGS_INPUT: '#filterTags',
  Basic: {
    ADD_EXPRESSION_BUTTON: '[title=\'Adds a new expression to the filter\']',
    MATCH_ALL_RADIO_BUTTON: '[ng-model=\'root.grouping\'][value=\'And\']',
    MATCH_ANY_RADIO_BUTTON: '[ng-model=\'root.grouping\'][value=\'Or\']',
    COLUMN_DROPDOWN_WILDCARD: '[ng-model=\'expr.column\']',
    OPERATOR_DROPDOWN_WILDCARD: '[ng-model=\'expr.op\']',
    VALUE_DROPDOWN_WILDCARD: '[name=\'literal\']',
    EXPRESSION_1_COLUMN_DROPDOWN: '[ng-model=\'expr.column\']:eq(0)',
    EXPRESSION_1_OPERATOR_DROPDOWN: '[ng-model=\'expr.op\']:eq(0)',
    EXPRESSION_1_VALUE_DROPDOWN: '[name=\'literal\']:eq(0)',
    EXPRESSION_2_COLUMN_DROPDOWN: '[ng-model=\'expr.column\']:eq(1)',
    EXPRESSION_2_OPERATOR_DROPDOWN: '[ng-model=\'expr.op\']:eq(1)',
    EXPRESSION_2_VALUE_DROPDOWN: '[name=\'literal\']:eq(1)'
  },
  Advanced: {
    ADD_EXPRESSION_BUTTON: '[title=\'Adds a new expression to the filter\']',
    ADD_GROUP_BUTTON: '[title=\'Adds a new group to the filter\']',
    REMOVE_ELEMENT_BUTTON: '[title=\'Removes an element from the filter\']',
    GROUPING_NODE_WILDCARD: '.c-node-toggle',
    GROUPING_OPERATOR_DROPDOWN_WILDCARD: '[ng-model=\'item.grouping\']',
    GROUPING_REMOVE_BUTTON_WILDCARD: '[ng-click=\'groupUi.remove()\'] [title=\'Remove the expression\']',
    GROUPING_1_NODE_WILDCARD: '.c-node-toggle:eq(0)',
    GROUPING_1_OPERATOR_DROPDOWN_WILDCARD: '[ng-model=\'item.grouping\']:eq(0)',
    GROUPING_1_REMOVE_BUTTON_WILDCARD: '[ng-click=\'groupUi.remove()\'] [title=\'Remove the expression\']:eq(0)',
    GROUPING_2_NODE_WILDCARD: '.c-node-toggle:eq(1)',
    GROUPING_2_OPERATOR_DROPDOWN_WILDCARD: '[ng-model=\'item.grouping\']:eq(1)',
    GROUPING_2_REMOVE_BUTTON_WILDCARD: '[ng-click=\'groupUi.remove()\'] [title=\'Remove the expression\']:eq(1)',
    EXPRESSION_TEXT_WILDCARD: '#editfeatureaction .grid-canvas .text-truncate',
    EXPRESSION_EDIT_BUTTON_WILDCARD: '[title=\'Edit the expression\']',
    EXPRESSION_REMOVE_BUTTON_WILDCARD: '[title=\'Remove the expression\']',
    EXPRESSION_1_TEXT: '#editfeatureaction .grid-canvas .text-truncate:eq(0)',
    EXPRESSION_1_EDIT_BUTTON: '[title=\'Edit the expression\']:eq(0)',
    EXPRESSION_1_REMOVE_BUTTON: '[title=\'Remove the expression\']:eq(0)',
    EXPRESSION_2_TEXT: '#editfeatureaction .grid-canvas .text-truncate:eq(1)',
    EXPRESSION_2_EDIT_BUTTON: '[title=\'Edit the expression\']:eq(1)',
    EXPRESSION_2_REMOVE_BUTTON: '[title=\'Remove the expression\']:eq(1)'
  },
  ADD_ACTION_BUTTON: '[title=\'Add a new action\']',
  SET_LABEL_DROPDOWN: '[ng-model=\'action.id\']',
  CONFIGURE_ACTION_BUTTON: '[title=\'Configure the action\']',
  OK_BUTTON: '[ng-click=\'ctrl.finish()\']',
  CANCEL_BUTTON: '[ng-click=\'ctrl.cancel()\']'
};

exports.customDateTimeFormatsDialog = {
  DIALOG: '[label=\'Custom Date/Time Formats\']',
  DIALOG_HEADER: '[title=\'Custom Date/Time Formats\']',
  DIALOG_CLOSE: '[label=\'Custom Date/Time Formats\'] .close',
  DIALOG_TEXT: '[label=\'Custom Date/Time Formats\'] .modal-body',
  CLOSE_BUTTON: '[ng-click=\'th.close()\']'
};

exports.editArcServerDialog = {
  DIALOG: '[label=\'Edit Arc Server\']',
  DIALOG_HEADER: '[title=\'Edit Arc Server\']',
  DIALOG_CLOSE: '[label=\'Edit Arc Server\'] .close',
  TITLE_INPUT: '[title=\'The title for the server\']',
  URL_INPUT: '[name=\'url\']',
  SAVE_BUTTON: '[ng-click=\'ctrl.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'ctrl.close()\']'
};

exports.editColumnAssociationDialog = {
  DIALOG: '#columnmappingform',
  DIALOG_HEADER: '[title=\'Create Column Association\']',
  DIALOG_CLOSE: '#columnmappingform .close',
  NAME_INPUT: '[name=\'name\']',
  DESCRIPTION_INPUT: '[name=\'description\']',
  ADD_ASSOCIATION_BUTTON: '[ng-click=\'cmFormCtrl.add()\']',
  Associations: {
    LAYER_DROPDOWN_WILDCARD: '.select2-chosen',
    COLUMN_DROPDOWN_WILDCARD: '.select2-chosen',
    REMOVE_EXPRESSION_BUTTON_WILDCARD: '[title=\'Remove this expression\']',
    LAYER_1_DROPDOWN: '.select2-chosen:eq(0)',
    COLUMN_1_DROPDOWN: '.select2-chosen:eq(0)',
    EXPRESSION_1_REMOVE_BUTTON: '[title=\'Remove this expression\']:eq(0)',
    LAYER_2_DROPDOWN: '.select2-chosen:eq(1)',
    COLUMN_2_DROPDOWN: '.select2-chosen:eq(1)',
    EXPRESSION_2_REMOVE_BUTTON: '[title=\'Remove this expression\']:eq(1)'
  },
  OK_BUTTON: '[ng-click=\'cmFormCtrl.confirm()\']',
  CANCEL_BUTTON: '[ng-click=\'cmFormCtrl.cancel()\']'
};

exports.editGeoServerDialog = {
  DIALOG: '[label=\'Edit GeoServer\']',
  DIALOG_HEADER: '[label=\'Edit GeoServer\'] [ng-class=\'headerClass\']',
  DIALOG_CLOSE: '[label=\'Edit GeoServer\'] .close',
  TITLE_INPUT: '[title=\'The title for the server\']',
  URL_INPUT: '[name=\'url\']',
  SAVE_BUTTON: '[ng-click=\'ctrl.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'ctrl.close()\']'
};

exports.editParametersDialog = {
  DIALOG: '#editParams',
  DIALOG_HEADER: '[title=\'Edit Parameters\']',
  DIALOG_CLOSE: '#editParams .close',
  URL_INPUT: '[placeholder=\'Server URL\']',
  ADD_PARAMETER_BUTTON: '[title=\'Add a new parameter row\']',
  REMOVE_PARAMETER_BUTTON: '[title=\'Remove the selected parameter row\']',
  GRID: '[options=\'ctrl.gridOptions\']',
  APPLY_BUTTON: '[title=\'Apply parameter changes and refresh the layer.\']',
  CANCEL_BUTTON: '[title=\'Cancel the parameter edit, discarding all changes.\']'
};

exports.editPlaceDialog = {
  DIALOG: '#placemarkEdit',
  DIALOG_HEADER: '[title=\'Add Place\']',
  DIALOG_CLOSE: '#placemarkEdit .close',
  NAME_INPUT: '[name=\'name\']',
  DESCRIPTION_INPUT: '.CodeMirror',
  POSITION_INPUT: '[ng-model=\'posText\']',
  POSITION_BUTTON: '[title=\'Set the position by clicking on the map\']',
  ENTERING_POSITION_BADGE: '[data-title=\'"Entering Position"\']',
  ALTITUDE_INPUT: '[name=\'altitude\']',
  ALTITUDE_UNITS_DROPDOWN: '[ng-model=\'ctrl.altUnits\']',
  Time: {
    NO_TIME: '[value=\'notime\']',
    Instant: {
      RADIOBUTTON: '[value=\'instant\']',
      DATE_INPUT: '#placemarkEdit [ui-date=\'wheelDate.dateOptions\']',
      HOUR_INPUT: '[ng-model=\'dateTimeCtrl.hour\']',
      MINUTE_INPUT: '[ng-model=\'dateTimeCtrl.minute\']',
      SECONDS_INPUT: '[ng-model=\'dateTimeCtrl.second\']',
      NOW_BUTTON: '[ng-click=\'dateTimeCtrl.setNow()\']',
      CLEAR_BUTTON: '[ng-click=\'dateTimeCtrl.reset()\']'
    },
    RANGE: {
      RADIOBUTTON: '[value=\'range\']',
      Start: {
        DATE_INPUT: '#placemarkEdit [ui-date=\'wheelDate.dateOptions\']:eq(0)',
        HOUR_INPUT: '[ng-model=\'dateTimeCtrl.hour\']:eq(0)',
        MINUTE_INPUT: '[ng-model=\'dateTimeCtrl.minute\']:eq(0)',
        SECONDS_INPUT: '[ng-model=\'dateTimeCtrl.second\']:eq(0)',
        NOW_BUTTON: '[ng-click=\'dateTimeCtrl.setNow()\']:eq(0)',
        CLEAR_BUTTON: '[ng-click=\'dateTimeCtrl.reset()\']:eq(0)'
      },
      End: {
        DATE_INPUT: '#placemarkEdit [ui-date=\'wheelDate.dateOptions\']:eq(1)',
        HOUR_INPUT: '[ng-model=\'dateTimeCtrl.hour\']:eq(1)',
        MINUTE_INPUT: '[ng-model=\'dateTimeCtrl.minute\']:eq(1)',
        SECONDS_INPUT: '[ng-model=\'dateTimeCtrl.second\']:eq(1)',
        NOW_BUTTON: '[ng-click=\'dateTimeCtrl.setNow()\']:eq(1)',
        CLEAR_BUTTON: '[ng-click=\'dateTimeCtrl.reset()\']:eq(1)'
      }
    },
    TIME_SELECTION_BADGE: '[ng-if=\'help\']'
  },
  Accordion: {
    styleOptions: {
      BUTTON: '[title=\'Style controls for the layer(s)\']',
      OPACITY_SLIDER: '[name=\'opacity\'] .ui-slider-handle',
      SIZE_SLIDER: '[name=\'size\'] .ui-slider-handle',
      colorPicker: {
        BUTTON: '[title=\'Sets the color/shape used to render features\'] [color=\'color\']',
        SELECTED_COLOR: '.c-colorpalette__selected',
        Color: {
          WHITE: '[title=\'#ffffff\']',
          BLACK: '[title=\'#000000\']',
          RED: '[title=\'#FF0000\']',
          ORANGE: '[title=\'#FFA500\']',
          YELLOW: '[title=\'#FFFF00\']',
          GREEN: '[title=\'#008000\']',
          BLUE: '[title=\'#0000FF\']',
          INDIGO: '[title=\'#4B0082\']',
          VIOLET: '[title=\'#EE82EE\']'
        },
        RESET_BUTTON: '[ng-click=\'palette.reset()\']'
      },
      DROPDOWN: '[ng-model=\'$parent.shape\']',
      Style: {
        Icon: {
          ICON_BUTTON: '[ng-model=\'icon\']',
          ROTATION_INPUT: '[name=\'iconRotation\']',
          ICON_ROTATION_BADGE: '[data-title=\'"Icon Rotation"\']'
        },
        Ellipse: {
          SEMI_MAJOR_INPUT: '[name=\'semiMajor\']',
          SEMI_MAJOR_UNITS_DROPDOWN: '[ng-model=\'ctrl.semiMajorUnits\']',
          SEMI_MAJOR_AXIS_BADGE: '[data-title=\'"Semi-Major Axis"\']',
          SEMI_MINOR_INPUT: '[name=\'semiMinor\']',
          SEMI_MINOR_UNITS_DROPDOWN: '[ng-model=\'ctrl.semiMinorUnits\']',
          SEMI_MINOR_AXIS_BADGE: '[data-title=\'"Semi-Minor Axis"\']',
          ORIENTATION_INPUT: '[name=\'orientation\']',
          ELLIPSE_ORIENTATION_BADGE: '[data-title=\'"Ellipse Orientation"\']'
        },
        ellipseWithCenter: {
          SEMI_MAJOR_INPUT: '[name=\'semiMajor\']',
          SEMI_MAJOR_UNITS_DROPDOWN: '[ng-model=\'ctrl.semiMajorUnits\']',
          SEMI_MAJOR_AXIS_BADGE: '[data-title=\'"Semi-Major Axis"\']',
          SEMI_MINOR_INPUT: '[name=\'semiMinor\']',
          SEMI_MINOR_UNITS_DROPDOWN: '[ng-model=\'ctrl.semiMinorUnits\']',
          SEMI_MINOR_AXIS_BADGE: '[data-title=\'"Semi-Minor Axis"\']',
          ORIENTATION_INPUT: '[name=\'orientation\']',
          ELLIPSE_ORIENTATION_BADGE: '[data-title=\'"Ellipse Orientation"\']',
          CENTER_DROPDOWN: '[ng-change=\'ctrl.onCenterShapeChange($parent.centerShape)\']',
          ICON_BUTTON: '[ng-model=\'icon\']',
          ROTATION_INPUT: '[name=\'iconRotation\']',
          ICON_ROTATION_BADGE: '[data-title=\'"Icon Rotation"\']'
        }
      }
    },
    labelOptions: {
      Label: {
        BUTTON: '[title=\'Configure how labels are displayed for the layer\']',
        colorPicker: {
          BUTTON: '[title=\'Sets the color/shape used to render features\'] [color=\'color\']',
          SELECTED_COLOR: '.c-colorpalette__selected',
          Color: {
            WHITE: '[title=\'#ffffff\']',
            BLACK: '[title=\'#000000\']',
            RED: '[title=\'#FF0000\']',
            ORANGE: '[title=\'#FFA500\']',
            YELLOW: '[title=\'#FFFF00\']',
            GREEN: '[title=\'#008000\']',
            BLUE: '[title=\'#0000FF\']',
            INDIGO: '[title=\'#4B0082\']',
            VIOLET: '[title=\'#EE82EE\']'
          },
          RESET_BUTTON: '[ng-click=\'palette.reset()\']'
        },
        SIZE_DROPDOWN: '[name=\'spinner\']',
        ALWAYS_SHOW_LABELS_CHECKBOX: '#showLabels',
        Column: {
          HANDLE_WILDCARD: '[title=\'Click and Drag to move this label\']',
          CHECKBOX_WILDCARD: '[ng-model=\'label.showColumn\']',
          DROPDOWN_WILDCARD: '[title=\'Sets the data field used for labels\']',
          REMOVE_COLUMN_BUTTON_WILDCARD: '[title=\'Remove this label\']',
          ADD_COLUMN_BUTTON: '[title=\'Add a label\']',
          COLUMN_1_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
          COLUMN_1_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
          COLUMN_1_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
          COLUMN_2_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
          COLUMN_2_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
          COLUMN_2_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
          COLUMN_3_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
          COLUMN_3_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
          COLUMN_3_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
          COLUMN_4_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
          COLUMN_4_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
          COLUMN_4_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
          COLUMN_5_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
          COLUMN_5_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
          COLUMN_5_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)'
        }
      }
    },
    annotationOptions: {
      SHOW_ANNOTATION_CHECKBOX: '[ng-attr-for=\'showAnnotation{{ctrl.uid}}\']',
      SHOW_NAME_CHECKBOX: '[ng-attr-for=\'showAnnotationName{{ctrl.uid}}\']',
      SHOW_DESCRIPTION_CHECKBOX: '[ng-attr-for=\'showAnnotationDescription{{ctrl.uid}}\']',
      SHOW_DEFAULTTAILTYPE_RADIOBUTTON: '[ng-attr-for=\'showAnnotationDefaultTail{{ctrl.uid}}\']',
      SHOW_NOTAILTYPE_RADIOBUTTON: '[ng-attr-for=\'showAnnotationNoTail{{ctrl.uid}}\']',
      SHOW_LINETAILTYPE_RADIOBUTTON: '[ng-attr-for=\'showAnnotationLineTail{{ctrl.uid}}\']'
    }
  },
  OK_BUTTON: '[ng-class=\'yesButtonClass\']',
  CANCEL_BUTTON: '[ng-class=\'noButtonClass\']'
};

exports.enterAreaCoordinatesDialog = {
  DIALOG: '[label=\'Enter Area Coordinates\']',
  DIALOG_HEADER: '[title=\'Enter Area Coordinates\']',
  DIALOG_CLOSE: '[label=\'Enter Area Coordinates\'] .close',
  boundingBox: {
    NAME_INPUT: '[name=\'name\']',
    LONGITUDE_FIRST_CHECKBOX: '[name=\'lonFirst\']',
    CORNER_1_INPUT: '[name=\'pos\']:eq(0)',
    CORNER_1_BADGE: '[data-title=\'"Entering Position"\']:eq(0)',
    CORNER_2_INPUT: '[name=\'pos\']:eq(0)',
    CORNER_2_BADGE: '[data-title=\'"Entering Position"\']:eq(0)'
  },
  Circle: {
    NAME_INPUT: '[name=\'name\']',
    LONGITUDE_FIRST_CHECKBOX: '[name=\'lonFirst\']',
    CENTER_INPUT: '[name=\'pos\']',
    CENTER_BADGE: '[data-title=\'"Entering Position"\']',
    RADIUS_INPUT: '[name=\'radius\]',
    RADIUS_UNITS_DROPDOWN: '[ng-model=\'ctrl.radiusUnits\']'
  },
  Polygon: {
    NAME_INPUT: '[name=\'name\']',
    LONGITUDE_FIRST_CHECKBOX: '[name=\'lonFirst\']',
    COORDINATES_INPUT: '[name=\'coordinates\']',
    COORDINATES_BADGE: '[data-title=\'"Entering Coordinates"\']'
  },
  OK_BUTTON: '[ng-click=\'ctrl.confirm()\']',
  CANCEL_BUTTON: '[ng-click=\'confirm.cancel()\']'
};

exports.exportColumnAssociationsDialog = {
  DIALOG: '[label=\'Export Column Associations\']',
  DIALOG_HEADER: '[title=\'Export Column Associations\']',
  DIALOG_CLOSE: '[label=\'Export Column Associations\'] .close',
  NAME_INPUT: '[name=\'title\']',
  SAVE_TO_DROPDOWN: '[name=\'persister\']',
  EXPORT_ALL_RADIO_BUTTON: '[name=\'timeTypeRadios\']:eq(0)',
  EXPORT_SELECTED_RADIO_BUTTON: '[name=\'timeTypeRadios\']:eq(0)',
  OK_BUTTON: '[ng-click=\'cmExportCtrl.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'cmExportCtrl.close()\']'
};

exports.exportDataDialog = {
  DIALOG: '#export',
  DIALOG_HEADER: '[title=\'Export Data\']',
  DIALOG_CLOSE: '#export .close',
  NAME_INPUT: '[name=\'title\']',
  SAVE_TO_DROPDOWN: '[ng-model=\'persister\']',
  TYPE_DROPDOWN: '[ng-model=\'exporter\']',
  EXPORT_SELECTED_FEATURES_CHECKBOX: '#js-export-options__useselected',
  SOURCE_CHECKBOX_WILDCARD: '#export [name=\'items\']',
  OK_BUTTON: '[ng-click=\'exportdialog.confirm()\']',
  CANCEL_BUTTON: '[ng-click=\'exportdialog.cancel()\']'
};

exports.exportFeatureActionsDialog = {
  DIALOG: '#filteractionexport',
  DIALOG_HEADER: '[title=\'Export Feature Actions\']',
  DIALOG_CLOSE: '#filteractionexport .close',
  NAME_INPUT: '[name=\'title\']',
  EXPORT_ACTIVE_RADIO_BUTTON: '[name=\'exportmode\']:eq(0)',
  EXPORT_SELECTED_RADIO_BUTTON: '[name=\'exportmode\']:eq(1)',
  EXPORT_ALL_RADIO_BUTTON: '[name=\'exportmode\']:eq(2)',
  OK_BUTTON: '[ng-click=\'ctrl.save()\']',
  CANCEL_BUTTON: '[ng-click=\'ctrl.cancel()\']'
};

exports.exportHeatmapDialog = {
  DIALOG: '#exportDialog',
  DIALOG_HEADER: '[title=\'Export: Heatmap - load-data-file-test-features.kmz.kmz\']',
  DIALOG_CLOSE: '#exportDialog .close',
  NAME_INPUT: '[name=\'title\']',
  SAVE_TO_DROPDOWN: '[ng-model=\'persister\']',
  OK_BUTTON: '[ng-click=\'exportdialog.confirm()\']',
  CANCEL_BUTTON: '[ng-click=\'exportdialog.cancel()\']'
};

exports.exportPlacesDialog = {
  DIALOG: '[label=\'Export Places\']',
  DIALOG_HEADER: '[title=\'Export Places\']',
  DIALOG_CLOSE: '[label=\'Export Places\'] .close',
  NAME_INPUT: '[name=\'title\']',
  SAVE_TO_DROPDOWN: '[ng-model=\'treeExport.persister\']',
  COMPRESS_AS_KML_CHECKBOX: '#js-kmlexport__compress',
  USE_FEATURE_COLORS: '#js-kmlexport__useItemColor',
  EXPORT_ELLIPSES: '#js-kmlexport__exportEllipses',
  DEFAULT_ICON_BUTTON: '[ng-click=\'iconPicker.show()\']',
  OK_BUTTON: '[ng-click=\'treeExport.confirm()\']',
  CANCEL_BUTTON: '[ng-click=\'treeExport.cancel()\']'
};

exports.featureActionsDialog = {
  DIALOG: ':contains(\'Feature Actions\').modal',
  DIALOG_HEADER: ':contains("Feature Actions").modal-header',
  DIALOG_CLOSE: ':contains("Feature Actions")>.close',
  SEARCH_INPUT: '[ng-change=\'ctrl.search()\']',
  CLEAR_BUTTON: '[title=\'Clear the search term\'][ng-click=\'ctrl.clearSearch()\']',
  GROUP_BY_DROPDOWN: '[ng-change=\'ctrl.search()\'][ng-options=\'key for (key, value) in views\']',
  CREATE_BUTTON: '[ng-click=\'ctrl.editEntry()\']',
  FEATURE_ACTIONS_BADGE: '[x-title=\'helpTitle\']',
  featureAction: {
    TOGGLE_CHECKBOX_WILDCARD: '[title=\'If the action should automatically execute against loaded data\']',
    TEXT_WILDCARD: '[label=\'Feature Actions for load-data-file-test-features.zip Features\'] .text-truncate span',
    COPY_BUTTON_WILDCARD: '[title=\'Copy the action\']',
    EDIT_BUTTON_WILDCARD: '[title=\'Edit the action\']',
    REMOVE_BUTTON_WILDCARD: '[title=\'Remove the action\']',
    FEATURE_1_TOGGLE_CHECKBOX_WILDCARD: '[title=\'If the action should automatically execute against ' +
    'loaded data\']:eq(0)',
    FEATURE_1_TEXT_WILDCARD: '[label=\'Feature Actions for load-data-file-test-features.zip Features\'] ' +
    '.text-truncate span:eq(0)',
    FEATURE_1_COPY_BUTTON_WILDCARD: '[title=\'Copy the action\']:eq(0)',
    FEATURE_1_EDIT_BUTTON_WILDCARD: '[title=\'Edit the action\']:eq(0)',
    FEATURE_1_REMOVE_BUTTON_WILDCARD: '[title=\'Remove the action\']:eq(0)',
    FEATURE_2_TOGGLE_CHECKBOX_WILDCARD: '[title=\'If the action should automatically execute against ' +
    'loaded data\']:eq(1)',
    FEATURE_2_TEXT_WILDCARD: '[label=\'Feature Actions for load-data-file-test-features.zip Features\'] ' +
    '.text-truncate span:eq(1)',
    FEATURE_2_COPY_BUTTON_WILDCARD: '[title=\'Copy the action\']:eq(1)',
    FEATURE_2_EDIT_BUTTON_WILDCARD: '[title=\'Edit the action\']:eq(1)',
    FEATURE_2_REMOVE_BUTTON_WILDCARD: '[title=\'Remove the action\']:eq(1)',
    FEATURE_3_TOGGLE_CHECKBOX_WILDCARD: '[title=\'If the action should automatically execute against ' +
    'loaded data\']:eq(2)',
    FEATURE_3_TEXT_WILDCARD: '[label=\'Feature Actions for load-data-file-test-features.zip Features\'] ' +
    '.text-truncate span:eq(2)',
    FEATURE_3_COPY_BUTTON_WILDCARD: '[title=\'Copy the action\']:eq(2)',
    FEATURE_3_EDIT_BUTTON_WILDCARD: '[title=\'Edit the action\']:eq(2)',
    FEATURE_3_REMOVE_BUTTON_WILDCARD: '[title=\'Remove the action\']:eq(2)'
  },
  EXPORT_BUTTON: '[ng-click=\'ctrl.launchExport()\']',
  IMPORT_BUTTON: '[ng-click=\'ctrl.launchImport()\']',
  APPLY_BUTTON: '[ng-click=\'ctrl.apply()\']',
  CLOSE_BUTTON: '[ng-click=\'ctrl.close()\']'
};

exports.featureInfoDialog = {
  DIALOG: '#featureInfo',
  DIALOG_HEADER: '#featureInfo [title=\'Feature Info\']',
  DIALOG_CLOSE: '#featureInfo .close',
  SEARCH_INPUT: '[placeholder=\'Search features\']',
  CLEAR_BUTTON: '#featureInfo [title=\'Clear the search term\']',
  Grid: {
    FEATURE_TEXT_WILDCARD: '#featureInfo .slick-cell.r1',
    FEATURE_1_TEXT: '#featureInfo .slick-cell.r1:eq(0)',
    FEATURE_2_TEXT: '#featureInfo .slick-cell.r1:eq(1)',
    FEATURE_3_TEXT: '#featureInfo .slick-cell.r1:eq(2)',
    FEATURE_4_TEXT: '#featureInfo .slick-cell.r1:eq(3)',
    FEATURE_5_TEXT: '#featureInfo .slick-cell.r1:eq(4)'
  },
  FEATURE_NAME_TEXT: '[ng-attr-title=\'{{info.title}}\']',
  COORDINATES_TEXT: '[ng-bind-html=\'simpleLocationCtrl.location\']',
  ACTIVE_COORDINATES_CLASS: '#featureInfo .btn-group .active',
  DD_BUTTON: '[title=\'Display in Decimal Degrees\']',
  DMS_BUTTON: '[title=\'Display in Degrees Minutes Seconds\']',
  DDM_BUTTON: '[title=\'Display in Degrees Decimal Minutes\']',
  MGRS_BUTTON: '[title=\'Display in Military Grid Reference System\']',
  FEATURE_TEXT: '[items=\'activeTab\']'
};

exports.fileExistsDialog = {
  DIALOG: '[label=\'File Exists!\']',
  DIALOG_HEADER: '[title=\'File Exists!\']',
  SAVE_RADIO_BUTTON: '[value=\'saveNew\']',
  REPLACE_PREVIOUS_BUTTON: '[value=\'replace\']',
  REPLACE_REIMPORT_BUTTON: '[value=\'replaceAndImport\']',
  OK_BUTTON: '[ng-click=\'confirm.confirm()\']',
  CANCEL_BUTTON: '[ng-click=\'confirm.cancel()\']'
};

exports.geoJSONAreaImportDialog = {
  DIALOG: '[label=\'GeoJSON Area Import\']',
  DIALOG_HEADER: '[title=\'GeoJSON Area Import\']',
  DIALOG_CLOSE: '[label=\'GeoJSON Area Import\'] .close',
  Tabs: {
    areaOptions: {
      TITLE_COLUMN_INPUT: '[ng-model=\'config.titleColumn\']',
      DESCRIPTION_COLUMN_DROPDOWN: '[ng-model=\'config.descColumn\']',
      DESCRIPTION_INPUT: '[name=\'description\']',
      TAGS_COLUMN_DROPDOWN: '[ng-model=\'config.tagsColumn\']',
      TAGS_INPUT: '[name=\'tags\']',
      MERGE_AREAS_CHECKBOX: '[name=\'merge\']'
    }
  },
  PREV_BUTTON: '[title=\'Previous step\']',
  NEXT_BUTTON: '[title=\'Next step\']',
  DONE_BUTTON: '[ng-click=\'wiz.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'wiz.cancel()\']'
};

exports.historyDialog = {
  DIALOG: '#history',
  DIALOG_HEADER: '[title=\'History\']',
  DIALOG_CLOSE: '#history .close',
  COMMAND_WILDCARD: '[ng-repeat=\'command in historyView.commandHistory\']',
  CLEAR_HISTORY_BUTTON: '[title=\'Clear all history\']'
};

exports.importCesiumIonAssetDialog = {
  DIALOG: '#importIonAsset',
  DIALOG_HEADER: '[title=\'Import Cesium Ion Asset\']',
  DIALOG_CLOSE: '#importIonAsset .close',
  TITLE_INPUT: '[name=\'title\']',
  DESCRIPTION_INPUT: '[name=\'description\']',
  TAGS_INPUT: '[name=\'tags\']',
  ASSET_ID_INPUT: '[name=\'assetId\']',
  ACCESS_TOKEN_INPUT: '[name=\'accessToken\']',
  OK_BUTTON: '[ng-click=\'ctrl.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'ctrl.close()\']'
};

exports.importCSVDialog = {
  DIALOG: '[label=\'CSV Import\']',
  DIALOG_HEADER: '[title=\'CSV Import\']',
  DIALOG_CLOSE: '[label=\'CSV Import\'] .close',
  Tabs: {
    Configuration: {
      HEADER_ROW_SPINNER: '[name=\'spinner\']:eq(0)',
      HEADER_ROW_CHECKBOX: '[ng-model=\'config.useHeader\']',
      DELIMITER_DROPDOWN: '[ng-model=\'config.delimiter\']',
      DATA_ROW_SPINNER: '[name=\'spinner\']:eq(0)',
      COMMENT_DROPDOWN: '[ng-model=\'config.commentChar\']',
      RAW_DATA_TEXT: '[x-data=\'configStep.linePreviewRows\']',
      PREVIEW_DATA_TEXT: '[x-data=\'config.preview\']'
    },
    Geometry: {
      FORMAT_HELP_BUTTON: '[title=\'Help for location formats\']',
      noGeometry: {
        RADIOBUTTON: '[name=\'geomTypeRadios\':eq(0)]'
      },
      separateLatLon: {
        RADIOBUTTON: '[name=\'geomTypeRadios\':eq(1)]',
        LATITUDE_DROPDOWN: '[ng-model=\'step.latColumn\']',
        AUTO_FORMAT_CHECKBOX: '[ng-model=\'step.useGeoSeparateAutoFormat\']',
        COORDINATES_FORMAT_DROPDOWN: '[ng-model=\'step.geoSeparateFormat\']',
        LONGITUDE_DROPDOWN: '[ng-model=\'step.lonColumn\']',
        SAMPLE_TEXT: '.d-block:eq(0)',
        RESULT_TEXT: '.d-block:eq(1)',
        ALTITUDE_DROPDOWN: '[name=\'altitude\']',
        UNITS_DROPDOWN: '[ng-model=\'step.altitude.units\']',
        BEARING_DROPDOWN: '[name=\'bearing\']',
        IGNORE_ROWS_CHECKBOX: '[ng-model=\'step.ignoreMissingGeomRows\']',
        ELLIPSE_FIELDS_CHECKBOX: '[ng-model=\'step.showEllipse\']',
        Ellipse: {
          RADIUS_CEP_DROPDOWN: '[ng-model=\'step.ellipse.radius.column\']',
          RADIUS_CEP_UNITS_DROPDOWN: '[ng-model=\'step.ellipse.radius.units\']',
          SEMI_MAJOR_DROPDOWN: '[name=\'semiMajor\']',
          SEMI_MAJOR_UNITS_DROPDOWN: '[ng-model=\'step.ellipse.semiMajor.units\']',
          SEMI_MINOR_DROPDOWN: '[name=\'semiMinor\']',
          SEMI_MINOR_UNITS_DROPDOWN: '[ng-model=\'step.ellipse.semiMinor.units\']',
          ORIENTATION_DROPDOWN: '[name=\'orientation\']'
        }
      },
      singleGeometry: {
        RADIOBUTTON: '[name=\'geomTypeRadios\':eq(2)]',
        COLUMN_DROPDOWN: '[ng-model=\'step.posColumn\']',
        TYPE_DROPDOWN: '[ng-model=\'step.posType\']',
        SAMPLE_TEXT: '[ng-if=\'geomStep.sample\']',
        RESULT_TEXT: '.d-block:eq(1)',
        ALTITUDE_DROPDOWN: '[name=\'altitude\']',
        UNITS_DROPDOWN: '[ng-model=\'step.altitude.units\']',
        BEARING_DROPDOWN: '[name=\'bearing\']',
        IGNORE_ROWS_CHECKBOX: '[ng-model=\'step.ignoreMissingGeomRows\']',
        ELLIPSE_FIELDS_CHECKBOX: '[ng-model=\'step.showEllipse\']',
        Ellipse: {
          RADIUS_CEP_DROPDOWN: '[ng-model=\'step.ellipse.radius.column\']',
          RADIUS_CEP_UNITS_DROPDOWN: '[ng-model=\'step.ellipse.radius.units\']',
          SEMI_MAJOR_DROPDOWN: '[name=\'semiMajor\']',
          SEMI_MAJOR_UNITS_DROPDOWN: '[ng-model=\'step.ellipse.semiMajor.units\']',
          SEMI_MINOR_DROPDOWN: '[name=\'semiMinor\']',
          SEMI_MINOR_UNITS_DROPDOWN: '[ng-model=\'step.ellipse.semiMinor.units\']',
          ORIENTATION_DROPDOWN: '[name=\'orientation\']'
        }
      },
      PREVIEW_DATA_TEXT: '[x-data=\'config.preview\']'
    },
    Time: {
      FORMAT_HELP_BUTTON: '[title=\'Help for custom date and time formats\']',
      noTime: {
        RADIOBUTTON: '[value=\'none\']'
      },
      Instant: {
        RADIOBUTTON: '[value=\'instant\']',
        Type: {
          DROPDOWN: '[ng-model=\'model.dateType\']',
          dateTime: {
            DATE_DROPDOWN: '[ng-model=\'model.dateColumn\']',
            FORMAT_DROPDOWN: '[ng-change=\'tiUI.onDateFormat()\']',
            CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']'
          },
          separateDateTime: {
            DATE_DROPDOWN: '[ng-change=\'tiUI.onDateColumn()\']',
            DATE_FORMAT_DROPDOWN: '[ng-model=\'tiUI.dateFormat\']',
            DATE_CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']',
            TIME_DROPDOWN: '[ng-model=\'model.timeColumn\']',
            TIME_FORMAT_DROPDOWN: '[ng-model=\'tiUI.timeFormat\']',
            TIME_CUSTOM_INPUT: '[ng-model=\'model.timeFormat\']'
          },
          dateOnly: {
            DATE_DROPDOWN: '[ng-model=\'model.dateColumn\']',
            FORMAT_DROPDOWN: '[ng-change=\'tiUI.onDateFormat()\']',
            CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']'
          },
          SAMPLE_TEXT: '.d-block:eq(0)',
          RESULT_TEXT: '.d-block:eq(1)'
        }
      },
      timeRange: {
        RADIOBUTTON: '[value=\'range\']',
        Start: {
          Type: {
            DROPDOWN: '[ng-model=\'model.dateType\']:eq(0)',
            dateTime: {
              DATE_DROPDOWN: '[ng-model=\'model.dateColumn\']:eq(0)',
              FORMAT_DROPDOWN: '[ng-change=\'tiUI.onDateFormat()\']:eq(0)',
              CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']:eq(0)'
            },
            separateDateTime: {
              DATE_DROPDOWN: '[ng-change=\'tiUI.onDateColumn()\']:eq(0)',
              DATE_FORMAT_DROPDOWN: '[ng-model=\'tiUI.dateFormat\']:eq(0)',
              DATE_CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']:eq(0)',
              TIME_DROPDOWN: '[ng-model=\'model.timeColumn\']:eq(0)',
              TIME_FORMAT_DROPDOWN: '[ng-model=\'tiUI.timeFormat\']:eq(0)',
              TIME_CUSTOM_INPUT: '[ng-model=\'model.timeFormat\']:eq(0)'
            },
            dateOnly: {
              DATE_DROPDOWN: '[ng-model=\'model.dateColumn\']:eq(0)',
              FORMAT_DROPDOWN: '[ng-change=\'tiUI.onDateFormat()\']:eq(0)',
              CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']:eq(0)'
            }
          },
          SAMPLE_TEXT: '.d-block:eq(0)',
          RESULT_TEXT: '.d-block:eq(1)'
        },
        End: {
          Type: {
            DROPDOWN: '[ng-model=\'model.dateType\']:eq(1)',
            dateTime: {
              DATE_DROPDOWN: '[ng-model=\'model.dateColumn\']:eq(1)',
              FORMAT_DROPDOWN: '[ng-change=\'tiUI.onDateFormat()\']:eq(1)',
              CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']:eq(1)'
            },
            separateDateTime: {
              DATE_DROPDOWN: '[ng-change=\'tiUI.onDateColumn()\']:eq(1)',
              DATE_FORMAT_DROPDOWN: '[ng-model=\'tiUI.dateFormat\']:eq(1)',
              DATE_CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']:eq(1)',
              TIME_DROPDOWN: '[ng-model=\'model.timeColumn\']:eq(1)',
              TIME_FORMAT_DROPDOWN: '[ng-model=\'tiUI.timeFormat\']:eq(1)',
              TIME_CUSTOM_INPUT: '[ng-model=\'model.timeFormat\']:eq(1)'
            },
            dateOnly: {
              DATE_DROPDOWN: '[ng-model=\'model.dateColumn\']:eq(1)',
              FORMAT_DROPDOWN: '[ng-change=\'tiUI.onDateFormat()\']:eq(1)',
              CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']:eq(1)'
            }
          },
          SAMPLE_TEXT: '.d-block:eq(2)',
          RESULT_TEXT: '.d-block:eq(3)'
        }
      },
      PREVIEW_DATA_TEXT: '[x-data=\'config.preview\']'
    },
    Options: {
      LAYER_TITLE_INPUT: '[name=\'title\']',
      DESCRIPTION_INPUT: '[name=\'desc\']',
      TAGS_INPUT: '[name=\'tags\']',
      colorPicker: {
        BUTTON: '[title=\'Sets the color/shape used to render features\'] [color=\'color\']',
        SELECTED_COLOR: '.c-colorpalette__selected',
        Color: {
          WHITE: '[title=\'#ffffff\']',
          BLACK: '[title=\'#000000\']',
          RED: '[title=\'#FF0000\']',
          ORANGE: '[title=\'#FFA500\']',
          YELLOW: '[title=\'#FFFF00\']',
          GREEN: '[title=\'#008000\']',
          BLUE: '[title=\'#0000FF\']',
          INDIGO: '[title=\'#4B0082\']',
          VIOLET: '[title=\'#EE82EE\']'
        },
        RESET_BUTTON: '[ng-click=\'palette.reset()\']'
      }
    }
  },
  PREV_BUTTON: '[title=\'Previous step\']',
  NEXT_BUTTON: '[title=\'Next step\']',
  DONE_BUTTON: '[ng-click=\'wiz.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'wiz.cancel()\']'
};

exports.importDataDialog = {
  DIALOG: '#urlimport',
  DIALOG_HEADER: '[title=\'Import Data\']',
  DIALOG_CLOSE: '#urlimport .close',
  CHOOSE_A_FILE_OR_URL_FILE_INPUT: '[placeholder=\'Choose a file or enter a URL\']',
  BROWSE_BUTTON: '[title=\'Choose a local file\']',
  NEXT_BUTTON: '[title=\'Load the file for import\']',
  CANCEL_BUTTON: '[title=\'Cancel file import\']'
};

exports.importGeoJSONDialog = {
  DIALOG: '[label=\'Import GeoJSON\']',
  DIALOG_HEADER: '[title=\'Import GeoJSON\']',
  DIALOG_CLOSE: '[label=\'Import GeoJSON\'] .close',
  Tabs: {
    Time: {
      FORMAT_HELP_BUTTON: '[title=\'Help for custom date and time formats\']',
      noTime: {
        RADIOBUTTON: '[value=\'none\']'
      },
      Instant: {
        RADIOBUTTON: '[value=\'instant\']',
        Type: {
          DROPDOWN: '[ng-model=\'model.dateType\']',
          dateTime: {
            DATE_DROPDOWN: '[ng-model=\'model.dateColumn\']',
            FORMAT_DROPDOWN: '[ng-change=\'tiUI.onDateFormat()\']',
            CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']'
          },
          separateDateTime: {
            DATE_DROPDOWN: '[ng-change=\'tiUI.onDateColumn()\']',
            DATE_FORMAT_DROPDOWN: '[ng-model=\'tiUI.dateFormat\']',
            DATE_CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']',
            TIME_DROPDOWN: '[ng-model=\'model.timeColumn\']',
            TIME_FORMAT_DROPDOWN: '[ng-model=\'tiUI.timeFormat\']',
            TIME_CUSTOM_INPUT: '[ng-model=\'model.timeFormat\']'
          },
          dateOnly: {
            DATE_DROPDOWN: '[ng-model=\'model.dateColumn\']',
            FORMAT_DROPDOWN: '[ng-change=\'tiUI.onDateFormat()\']',
            CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']'
          },
          SAMPLE_TEXT: '.d-block:eq(0)',
          RESULT_TEXT: '.d-block:eq(1)'
        }
      },
      timeRange: {
        RADIOBUTTON: '[value=\'range\']',
        Start: {
          Type: {
            DROPDOWN: '[ng-model=\'model.dateType\']:eq(0)',
            dateTime: {
              DATE_DROPDOWN: '[ng-model=\'model.dateColumn\']:eq(0)',
              FORMAT_DROPDOWN: '[ng-change=\'tiUI.onDateFormat()\']:eq(0)',
              CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']:eq(0)'
            },
            separateDateTime: {
              DATE_DROPDOWN: '[ng-change=\'tiUI.onDateColumn()\']:eq(0)',
              DATE_FORMAT_DROPDOWN: '[ng-model=\'tiUI.dateFormat\']:eq(0)',
              DATE_CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']:eq(0)',
              TIME_DROPDOWN: '[ng-model=\'model.timeColumn\']:eq(0)',
              TIME_FORMAT_DROPDOWN: '[ng-model=\'tiUI.timeFormat\']:eq(0)',
              TIME_CUSTOM_INPUT: '[ng-model=\'model.timeFormat\']:eq(0)'
            },
            dateOnly: {
              DATE_DROPDOWN: '[ng-model=\'model.dateColumn\']:eq(0)',
              FORMAT_DROPDOWN: '[ng-change=\'tiUI.onDateFormat()\']:eq(0)',
              CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']:eq(0)'
            },
            SAMPLE_TEXT: '.d-block:eq(0)',
            RESULT_TEXT: '.d-block:eq(1)'
          }
        },
        End: {
          Type: {
            DROPDOWN: '[ng-model=\'model.dateType\']:eq(1)',
            dateTime: {
              DATE_DROPDOWN: '[ng-model=\'model.dateColumn\']:eq(1)',
              FORMAT_DROPDOWN: '[ng-change=\'tiUI.onDateFormat()\']:eq(1)',
              CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']:eq(1)'
            },
            separateDateTime: {
              DATE_DROPDOWN: '[ng-change=\'tiUI.onDateColumn()\']:eq(1)',
              DATE_FORMAT_DROPDOWN: '[ng-model=\'tiUI.dateFormat\']:eq(1)',
              DATE_CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']:eq(1)',
              TIME_DROPDOWN: '[ng-model=\'model.timeColumn\']:eq(1)',
              TIME_FORMAT_DROPDOWN: '[ng-model=\'tiUI.timeFormat\']:eq(1)',
              TIME_CUSTOM_INPUT: '[ng-model=\'model.timeFormat\']:eq(1)'
            },
            dateOnly: {
              DATE_DROPDOWN: '[ng-model=\'model.dateColumn\']:eq(1)',
              FORMAT_DROPDOWN: '[ng-change=\'tiUI.onDateFormat()\']:eq(1)',
              CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']:eq(1)'
            },
            SAMPLE_TEXT: '.d-block:eq(0)',
            RESULT_TEXT: '.d-block:eq(1)'
          }
        }
      },
      PREVIEW_DATA_TEXT: '[x-data=\'config.preview\']'
    },
    Options: {
      LAYER_TITLE_INPUT: '[name=\'title\']',
      DESCRIPTION_INPUT: '[name=\'desc\']',
      TAGS_INPUT: '[name=\'tags\']',
      colorPicker: {
        BUTTON: '[title=\'Sets the color/shape used to render features\'] [color=\'color\']',
        SELECTED_COLOR: '.c-colorpalette__selected',
        Color: {
          WHITE: '[title=\'#ffffff\']',
          BLACK: '[title=\'#000000\']',
          RED: '[title=\'#FF0000\']',
          ORANGE: '[title=\'#FFA500\']',
          YELLOW: '[title=\'#FFFF00\']',
          GREEN: '[title=\'#008000\']',
          BLUE: '[title=\'#0000FF\']',
          INDIGO: '[title=\'#4B0082\']',
          VIOLET: '[title=\'#EE82EE\']'
        },
        RESET_BUTTON: '[ng-click=\'palette.reset()\']'
      }
    }
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
  LAYER_TITLE_INPUT: '[name=\'title\']',
  DESCRIPTION_INPUT: '[name=\'desc\']',
  TAGS_INPUT: '[name=\'tags\']',
  COLOR_PICKER: '[name=\'color\']',
  OK_BUTTON: '[title=\'Import the file\']',
  CANCEL_BUTTON: '[title=\'Cancel file import\']'
};

exports.importStateDialog = {
  DIALOG: '[label=\'Import State\']',
  DIALOG_HEADER: '[title=\'Import State\']',
  DIALOG_CLOSE: '[title=\'Import State\'] .close',
  NAME_INPUT: '[name=\'title\']',
  DESCRIPTION_INPUT: '[name=\'desc\']',
  TAGS_INPUT: '[name=\'tags\']',
  CLEAR_CHECKBOX: '[name=\'clear\']',
  Choose: {
    CHECKBOX: '[name=\'showOptions\']',
    ALL_CHECKBOX: '[name=\'all\']',
    CURRENT_VIEW_CHECKBOX: '[title=\'Sets the current map view/position\'] [type=\'checkbox\']',
    DATA_LAYERS_CHECKBOX: '[title=\'Sets the current layers\'] [type=\'checkbox\']',
    EXCLUSION_AREAS_CHECKBOX: '[title=\'Sets the current exclusion areas\'] [type=\'checkbox\']',
    FEATURE_ACTIONS_CHECKBOX: '[title=\'Sets the current Feature Actions\'] [type=\'checkbox\']',
    FILTERS_CHECKBOX: '[title=\'Sets the current filters\'] [type=\'checkbox\']',
    QUERY_AREAS_CHECKBOX: '[title=\'Sets the current query areas\'] [type=\'checkbox\']',
    QUERY_ENTRIES_CHECKBOX: '[title=\'Sets the query combinations\'] [type=\'checkbox\']',
    TIME_CHECKBOX: '[title=\'Sets the current timeline\'] [type=\'checkbox\']'
  },
  OK_BUTTON: '[ng-click=\'stateForm.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'stateForm.close()\']'
};

exports.importURLDialog = {
  DIALOG: '#urlimport',
  DIALOG_HEADER: '[title=\'Import URL\']',
  DIALOG_CLOSE: '#urlimport .close',
  ENTER_A_URL_INPUT: '[name=\'url\']',
  NEXT_BUTTON: '[title=\'Import the URL\']',
  CANCEL_BUTTON: '[title=\'Cancel URL import\']'
};

exports.layerDescriptionDialog = {
  DIALOG: '[label=\'Layer Description\']',
  DIALOG_HEADER: '[title=\'Layer Description\']',
  DIALOG_CLOSE: '[label=\'Layer Description\'] .close',
  DIALOG_TEXT: '[name=\'confirmForm\']',
  CLOSE_BUTTON: '[ng-class=\'yesButtonClass\']'
};

exports.layersDialog = {
  DIALOG: '[label=Layers]',
  DIALOG_HEADER: '.js-window__header',
  DIALOG_TIPS: '[title=\'Show help\']',
  DIALOG_CLOSE: '[label=Layers] .close',
  Tabs: {
    ACTIVE: '.active.nav-link',
    Layers: {
      TAB: '.nav-link:eq(0)',
      GROUP_BY_DROPDOWN: '[ng-change=\'layers.onGroupByChanged()\']',
      addData: {
        BUTTON: '[label=\'Layers\'] [title=\'Add data to the map\']',
        Menu: {
          BUTTON: '[label=\'Layers\'] .dropdown-toggle',
          PANEL: '#menu',
          menuOptions: {
            ADD_DATA: '[title=\'Browse the data catalog\']',
            OPEN_FILE_OR_URL: '[title=\'Import data from a local file or a URL\']',
            ADD_CESIUM_ION_ASSET: '[title=\'Loads a Cesium Ion asset in 3D mode\']',
            RECENT_STREET_MAP: ':contains(\'Street Map (Map)\').text-truncate',
            RECENT_WORLD_IMAGERY: ':contains(\'World Imagery (Map)\').text-truncate'
          },
          Recent: {
            DATA_WILDCARD: '[role=\'menuitem\']',
            DATA_1: '[role=\'menuitem\']:eq(3)',
            DATA_2: '[role=\'menuitem\']:eq(4)',
            DATA_3: '[role=\'menuitem\']:eq(5)',
            DATA_4: '[role=\'menuitem\']:eq(6)',
            DATA_5: '[role=\'menuitem\']:eq(7)'
          }
        }
      },
      SEARCH_INPUT: '[placeholder=\'Search active layers\']',
      CLEAR_BUTTON: '[title=\'Clear the search term\']',
      TILE_LAYERS_TOGGLE_BUTTON: '[title=\'Toggle Tile Layers\']',
      FEATURE_LAYERS_TOGGLE_BUTTON: '[title=\'Toggle Feature Layers\']',
      Tree: {
        LAYER_WILDCARD: '.slick-row',
        LAYER_NODE_WILDCARD: '.js-node-toggle',
        LAYER_NODE_EXPANDED_WILDCARD_CLASS: 'fa-caret-down',
        LAYER_NODE_COLLAPSED_WILDCARD_CLASS: 'fa-caret-right',
        LAYER_TOGGLE_CHECKBOX_WILDCARD: '[title=\'Show or hide the layer\']',
        LAYER_IS_ACTIVE_CLASS_WILDCARD: 'c-tristate-on',
        LAYER_IS_INACTIVE_CLASS_WILDCARD: 'c-tristate-off',
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
        Type: {
          imageLayer: {
            REMOVE_LAYER_BUTTON_WILDCARD: '[title=\'Remove the layer\']',
            contextMenu: {
              PANEL: '#menu',
              menuOptions: {
                EXPORT_HEATMAP: '[title=\'Exports the heatmap as a KML Ground Overlay\']',
                IDENTIFY: '[title=\'Identifies a layer on the map\']',
                REMOVE: '[title=\'Removes the layer\']',
                RENAME: '[title=\'Rename the layer\']'
              }
            },
            Accordion: {
              Style: {
                BUTTON: '[title=\'Style controls for the layer(s)\']',
                COLORS_DROPDOWN: '[title=\'Sets the color algorithm for the layer(s)\']',
                OPACITY_SLIDER: '[name=\'opacity\'] .ui-slider-handle',
                SIZE_SLIDER: '[name=\'size\'] .ui-slider-handle',
                INTENSITY_DROPDOWN: '[name=\'intensity\'] .spinner',
                INTENSITY_SLIDER: '[name=\'intensity\'] .ui-slider-handle'
              }
            }
          },
          featureLayer: {
            FEATURE_COUNT_TEXT_WILDCARD: 'span:eq(8)',
            REMOVE_LAYER_BUTTON_WILDCARD: '[title=\'Remove the layer\']',
            Server: {
              MANAGE_FILTERS_BUTTON_WILDCARD: '[title=\'Manage filters\']',
              contextMenu: {
                PANEL: '#menu',
                menuOptions: {
                  EDIT_PARAMETERS: '[title=\'Edit request parameters for the layer\']',
                  GO_TO: '[title=\'Repositions the map to show the layer\']',
                  IDENTIFY: '[title=\'Identifies a layer on the map\']',
                  CLEAR_SELECTION: '[title=\'Clears the selection for the layer\']',
                  ADD_TO_TIMELINE: '[title=\'Enables layer animation when the timeline is open\']',
                  REMOVE_FROM_TIMELINE: '[title=\'Disables layer animation when the timeline is open\']',
                  MOST_RECENT: '[title=\'Adjusts application time to show the most recent data for the layer\']',
                  REFRESH: '[title=\'Refreshes the layer\']',
                  LOCK: '[title=\'Lock the layer to prevent data from changing\']',
                  UNLOCK: '[title=\'Unlock the layer and refresh its data\']',
                  REMOVE: '[title=\'Removes the layer\']',
                  RENAME: '[title=\'Rename the layer\']',
                  SHOW_DESCRIPTION: '[title=\'Gives details about the layer\']',
                  EXPORT: '[title=\'Exports data from this layer\']',
                  ADD_TO_TRACK: '[title=\'Adds selected features (or all features if none are selected) ' +
                  'to an existing track.\']',
                  CREATE_BUFFER_REGION: '[title=\'Create buffer regions around loaded data\']',
                  CREATE_TRACK: '[title=\'Creates a new track by linking selected features (or all ' +
                  'features if none are selected) in time order.\']',
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
                  },
                  SAVE_TO_PLACES: '[title=\'Copies selected features to the Saved Places layer, or all ' +
                  'features if none selected\']'
                }
              }
            },
            Local: {
              contextMenu: {
                PANEL: '#menu',
                menuOptions: {
                  GO_TO: '[title=\'Repositions the map to show the layer\']',
                  IDENTIFY: '[title=\'Identifies a layer on the map\']',
                  CLEAR_SELECTION: '[title=\'Clears the selection for the layer\']',
                  ADD_TO_TIMELINE: '[title=\'Enables layer animation when the timeline is open\']',
                  REMOVE_FROM_TIMELINE: '[title=\'Disables layer animation when the timeline is open\']',
                  MOST_RECENT: '[title=\'Adjusts application time to show the most recent data for the layer\']',
                  REFRESH: '[title=\'Refreshes the layer\']',
                  REMOVE: '[title=\'Removes the layer\']',
                  RENAME: '[title=\'Rename the layer\']',
                  SHOW_DESCRIPTION: '[title=\'Gives details about the layer\']',
                  EXPORT: '[title=\'Exports data from this layer\']',
                  ADD_TO_TRACK: '[title=\'Adds selected features (or all features if none are selected) ' +
                  'to an existing track.\']',
                  CREATE_BUFFER_REGION: '[title=\'Create buffer regions around loaded data\']',
                  CREATE_TRACK: '[title=\'Creates a new track by linking selected features (or all ' +
                  'features if none are selected) in time order.\']',
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
                  },
                  SAVE_TO_PLACES: '[title=\'Copies selected features to the Saved Places layer, or all ' +
                  'features if none selected\']'
                }
              }
            },
            Accordion: {
              Style: {
                BUTTON: '[title=\'Style controls for the layer(s)\']',
                OPACITY_SLIDER: '[name=\'opacity\'] .ui-slider-handle',
                SIZE_SLIDER: '[name=\'size\'] .ui-slider-handle',
                colorPicker: {
                  BUTTON: '[title=\'Sets the color/shape used to render features\'] [color=\'color\']',
                  SELECTED_COLOR: '.c-colorpalette__selected',
                  Color: {
                    WHITE: '[title=\'#ffffff\']',
                    BLACK: '[title=\'#000000\']',
                    RED: '[title=\'#FF0000\']',
                    ORANGE: '[title=\'#FFA500\']',
                    YELLOW: '[title=\'#FFFF00\']',
                    GREEN: '[title=\'#008000\']',
                    BLUE: '[title=\'#0000FF\']',
                    INDIGO: '[title=\'#4B0082\']',
                    VIOLET: '[title=\'#EE82EE\']'
                  },
                  RESET_BUTTON: '[ng-click=\'palette.reset()\']'
                },
                DROPDOWN: '[ng-model=\'$parent.shape\']',
                Style: {
                  Icon: {
                    ICON_BUTTON: '[ng-model=\'icon\']',
                    ROTATION_CHECKBOX: '.no-text > .fa',
                    ROTATION_DROPDOWN: '[title=\'Sets the data field used for bearing\']'
                  },
                  LineOfBearing: {
                    BEARING_DROPDOWN: '[title=\'Sets the data field used for bearing\']',
                    Manual: {
                      RADIOBUTTON: '#lengthManual',
                      INPUT: '#lengthColumn',
                      SLIDER: '[name=\'length\']',
                      UNITS_DROPDOWN: '.ml-1[title=\'Sets the units field used for length\']'
                    },
                    Column: {
                      RADIOBUTTON: '#lengthColumn',
                      DROPDOWN: '[title=\'Sets the data field used for length\']',
                      UNITS_DROPDOWN: '[title=\'Sets the data field used for length\']',
                      MULTIPLER_INPUT: '[ng-model=\'columnLength\']'
                    },
                    showArrow: {
                      CHECKBOX: '#showArrow',
                      SIZE_INPUT: '[max=\'maxSize[ctrl.arrowUnits]\']',
                      UNITS_DROPDOWN: '[title=\'Sets the units field used for arrow size\']'
                    },
                    showEllipse: {
                      CHECKBOX: '#showEllipse',
                      SHOW_ELLIPSOIDS_CHECKBOX: '[name=\'showEllipsoids\']',
                      SHOW_GROUND_REF_CHECKBOX: '[name=\'showGroundReference\']'
                    },
                    showError: {
                      CHECKBOX: '#showError',
                      TIP_BUTTON: '[x-content=\'ctrl.helpText\']',
                      TIP_POPUP: '.popover',
                      BEARING_ERR_DROPDOWN: '[title=\'Sets the data field used for bearing error\']',
                      BEARING_ERR_MULTIPLYER_INPUT: '[ng-model=\'bearingErrorMultiplier\']',
                      LENGTH_ERR_DROPDOWN: '[title=\'Sets the data field used for length error\']',
                      LENGTH_ERR_UNITS_DROPDOWN: '[ng-model=\'ctrl.lengthErrorUnits\']',
                      LENGTH_ERR_MULTIPLER_INPUT: '[ng-model=\'lengthErrorMultiplier\']'
                    }
                  },
                  LineOfBearingWithCenter: {
                    CENTER_DROPDOWN: '[ng-model=\'$parent.centerShape\']',
                    BEARING_DROPDOWN: '[title=\'Sets the data field used for bearing\']',
                    Manual: {
                      RADIOBUTTON: '#lengthManual',
                      INPUT: '#lengthColumn',
                      SLIDER: '[name=\'length\']',
                      UNITS_DROPDOWN: '.ml-1[title=\'Sets the units field used for length\']'
                    },
                    Column: {
                      RADIOBUTTON: '#lengthColumn',
                      DROPDOWN: '[title=\'Sets the data field used for length\']',
                      UNITS_DROPDOWN: '[title=\'Sets the data field used for length\']',
                      MULTIPLER_INPUT: '[ng-model=\'columnLength\']'
                    },
                    showArrow: {
                      CHECKBOX: '#showArrow',
                      SIZE_INPUT: '[max=\'maxSize[ctrl.arrowUnits]\']',
                      UNITS_DROPDOWN: '[title=\'Sets the units field used for arrow size\']'
                    },
                    showEllipse: {
                      CHECKBOX: '#showEllipse',
                      SHOW_ELLIPSOIDS_CHECKBOX: '[name=\'showEllipsoids\']',
                      SHOW_GROUND_REF_CHECKBOX: '[name=\'showGroundReference\']'
                    },
                    showError: {
                      CHECKBOX: '#showError',
                      TIP_BUTTON: '[x-content=\'ctrl.helpText\']',
                      TIP_POPUP: '.popover',
                      BEARING_ERR_DROPDOWN: '[title=\'Sets the data field used for bearing error\']',
                      BEARING_ERR_MULTIPLYER_INPUT: '[ng-model=\'bearingErrorMultiplier\']',
                      LENGTH_ERR_DROPDOWN: '[title=\'Sets the data field used for length error\']',
                      LENGTH_ERR_UNITS_DROPDOWN: '[ng-model=\'ctrl.lengthErrorUnits\']',
                      LENGTH_ERR_MULTIPLER_INPUT: '[ng-model=\'lengthErrorMultiplier\']'
                    }
                  }
                }
              },
              Label: {
                BUTTON: '[title=\'Configure how labels are displayed for the layer\']',
                colorPicker: {
                  BUTTON: '[title=\'Sets the color/shape used to render features\'] [color=\'color\']',
                  SELECTED_COLOR: '.c-colorpalette__selected',
                  Color: {
                    WHITE: '[title=\'#ffffff\']',
                    BLACK: '[title=\'#000000\']',
                    RED: '[title=\'#FF0000\']',
                    ORANGE: '[title=\'#FFA500\']',
                    YELLOW: '[title=\'#FFFF00\']',
                    GREEN: '[title=\'#008000\']',
                    BLUE: '[title=\'#0000FF\']',
                    INDIGO: '[title=\'#4B0082\']',
                    VIOLET: '[title=\'#EE82EE\']'
                  },
                  RESET_BUTTON: '[ng-click=\'palette.reset()\']'
                },
                SIZE_DROPDOWN: '[name=\'spinner\']',
                ALWAYS_SHOW_LABELS_CHECKBOX: '#showLabels',
                Column: {
                  HANDLE_WILDCARD: '[title=\'Click and Drag to move this label\']',
                  CHECKBOX_WILDCARD: '[ng-model=\'label.showColumn\']',
                  DROPDOWN_WILDCARD: '[title=\'Sets the data field used for labels\']',
                  REMOVE_COLUMN_BUTTON_WILDCARD: '[title=\'Remove this label\']',
                  ADD_COLUMN_BUTTON: '[title=\'Add a label\']',
                  COLUMN_1_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
                  COLUMN_1_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
                  COLUMN_1_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
                  COLUMN_2_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
                  COLUMN_2_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
                  COLUMN_2_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
                  COLUMN_3_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
                  COLUMN_3_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
                  COLUMN_3_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
                  COLUMN_4_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
                  COLUMN_4_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
                  COLUMN_4_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
                  COLUMN_5_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
                  COLUMN_5_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
                  COLUMN_5_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)'
                }
              }
            },
            Options: {
              BUTTON: '[title=\'Configure the layer options\']',
              AUTO_REFRESH_DROPDOWN: '[ng-model=\'vector.refresh\']',
              UNIQUE_IDENTIFIER_DROPDOWN: '[ng-model=\'vector.uniqueId\']',
              ALTITUDE_MODE: '[title=\'Sets how the layer interprets altitude in 3D mode.\']',
              LOCK_LAYER_CHECKBOX: '#lockLayer'
            }
          },
          drawingLayer: {
            SAVE_BUTTON: '[title=\'Save\']',
            REMOVE_LAYER_BUTTON_WILDCARD: '[title=\'Remove the layer\']',
            parentContextMenu: {
              PANEL: '#menu',
              GO_TO: '[title=\'Repositions the map to show the layer\']',
              IDENTIFY: '[title=\'Identifies a layer on the map\']',
              RENAME: '[title=\'Rename the layer\']',
              SHOW_DESCRIPTION: '[title=\'Gives details about the layer\']'
            },
            contextMenu: {
              PANEL: '#menu',
              menuOptions: {
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
                SELECT_EXCLUSIVE: '[title=\'Select only features in this area, deselecting features ' +
                'outside of the area\']',
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
            Accordion: {
              Style: {
                BUTTON: '[title=\'Style controls for the layer(s)\']',
                OPACITY_SLIDER: '[name=\'opacity\'] .ui-slider-handle'
              }
            }
          },
          Track: {
            EDIT_TRACK_BUTTON_WILDCARD: '[title=\'Edit the place\']',
            REMOVE_LAYER_BUTTON_WILDCARD: '[title=\'Remove the layer\']',
            parentContextMenu: {
              PANEL: '#menu',
              GO_TO: '[title=\'Repositions the map to show the layer\']',
              IDENTIFY: '[title=\'Identifies a layer on the map\']',
              CLEAR_SELECTION: '[title=\'Clears the selection for the layer\']',
              ADD_TO_TIMELINE: '[title=\'Enables layer animation when the timeline is open\']',
              REMOVE_FROM_TIMELINE: '[title=\'Disables layer animation when the timeline is open\']',
              MOST_RECENT: '[title=\'Adjusts application time to show the most recent data for the layer\']',
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
              },
              SAVE_TO_PLACES: '[title=\'Copies selected features to the Saved Places layer, or all ' +
              'features if none selected\']'
            },
            contextMenu: {
              PANEL: '#menu',
              menuOptions: {
                CREATE_BUFFER_REGION: '[title=\'Create buffer regions around loaded data\']',
                ENABLE_TRACK_INTERPOLATION: '[title=\'Show the interpolated position of the track marker.\']',
                DISABLE_TRACK_INTERPOLATION: '[title=\'Only move track marker when there is a supporting feature.\']',
                FOLLOW_TRACK: '[title=\'Follow the track as it animates.\']',
                UNFOLLOW_TRACK: '[title=\'Cancel following the track during animation.\']',
                SHOW_TRACK_LINE: '[title=\'Show the track line.\']',
                HIDE_TRACK_LINE: '[title=\'Do not show the track line.\']',
                SAVE_TO_PLACES: '[title=\'Copies selected features to the Saved Places layer, or all ' +
                'features if none selected\']',
                FEATURE_INFO: '[title=\'Display detailed feature information\']',
                GO_TO: '[title=\'Repositions the map to show the layer\']'
              }
            },
            Accordion: {
              Style: {
                BUTTON: '[title=\'Style controls for the layer(s)\']',
                OPACITY_SLIDER: '[name=\'opacity\'] .ui-slider-handle',
                SIZE_SLIDER: '[name=\'size\'] .ui-slider-handle',
                colorPicker: {
                  BUTTON: '[title=\'Sets the color/shape used to render features\'] [color=\'color\']',
                  SELECTED_COLOR: '.c-colorpalette__selected',
                  Color: {
                    WHITE: '[title=\'#ffffff\']',
                    BLACK: '[title=\'#000000\']',
                    RED: '[title=\'#FF0000\']',
                    ORANGE: '[title=\'#FFA500\']',
                    YELLOW: '[title=\'#FFFF00\']',
                    GREEN: '[title=\'#008000\']',
                    BLUE: '[title=\'#0000FF\']',
                    INDIGO: '[title=\'#4B0082\']',
                    VIOLET: '[title=\'#EE82EE\']'
                  },
                  RESET_BUTTON: '[ng-click=\'palette.reset()\']'
                },
                DROPDOWN: '[ng-model=\'$parent.shape\']',
                Style: {
                  Icon: {
                    ICON_BUTTON: '[ng-model=\'icon\']',
                    ROTATION_CHECKBOX: '.no-text > .fa',
                    ROTATION_DROPDOWN: '[title=\'Sets the data field used for bearing\']'
                  }
                }
              },
              Label: {
                BUTTON: '[title=\'Configure how labels are displayed for the layer\']',
                colorPicker: {
                  BUTTON: '[title=\'Sets the color/shape used to render features\'] [color=\'color\']',
                  SELECTED_COLOR: '.c-colorpalette__selected',
                  Color: {
                    WHITE: '[title=\'#ffffff\']',
                    BLACK: '[title=\'#000000\']',
                    RED: '[title=\'#FF0000\']',
                    ORANGE: '[title=\'#FFA500\']',
                    YELLOW: '[title=\'#FFFF00\']',
                    GREEN: '[title=\'#008000\']',
                    BLUE: '[title=\'#0000FF\']',
                    INDIGO: '[title=\'#4B0082\']',
                    VIOLET: '[title=\'#EE82EE\']'
                  },
                  RESET_BUTTON: '[ng-click=\'palette.reset()\']'
                },
                SIZE_DROPDOWN: '[name=\'spinner\']',
                ALWAYS_SHOW_LABELS_CHECKBOX: '#showLabels',
                Column: {
                  HANDLE_WILDCARD: '[title=\'Click and Drag to move this label\']',
                  CHECKBOX_WILDCARD: '[ng-model=\'label.showColumn\']',
                  DROPDOWN_WILDCARD: '[title=\'Sets the data field used for labels\']',
                  REMOVE_COLUMN_BUTTON_WILDCARD: '[title=\'Remove this label\']',
                  ADD_COLUMN_BUTTON: '[title=\'Add a label\']',
                  COLUMN_1_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
                  COLUMN_1_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
                  COLUMN_1_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
                  COLUMN_2_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
                  COLUMN_2_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
                  COLUMN_2_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
                  COLUMN_3_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
                  COLUMN_3_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
                  COLUMN_3_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
                  COLUMN_4_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
                  COLUMN_4_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
                  COLUMN_4_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
                  COLUMN_5_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
                  COLUMN_5_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
                  COLUMN_5_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)'
                }
              }
            }
          },
          savedPlace: {
            CREATE_A_NEW_FOLDER_BUTTON_WILDCARD: '[title=\'Create a new folder\']',
            CREATE_A_NEW_SAVED_PLACE_BUTTON_WILDCARD: '[title=\'Create a new place\']',
            CREATE_A_NEW_ANNOTATION_BUTTON_WILDCARD: '[title=\'Create a new annotation\']',
            EDIT_PLACE_BUTTON_WILDCARD: '[title=\'Edit the place\']',
            REMOVE_LAYER_BUTTON_WILDCARD: '[title=\'Remove the layer\']',
            parentContextMenu: {
              PANEL: '#menu',
              GO_TO: '[title=\'Repositions the map to show the layer\']',
              IDENTIFY: '[title=\'Identifies a layer on the map\']',
              CLEAR_SELECTION: '[title=\'Clears the selection for the layer\']',
              ADD_TO_TIMELINE: '[title=\'Enables layer animation when the timeline is open\']',
              REMOVE_FROM_TIMELINE: '[title=\'Disables layer animation when the timeline is open\']',
              RENAME: '[title=\'Rename the layer\']',
              SHOW_DESCRIPTION: '[title=\'Gives details about the layer\']',
              EXPORT: '[title=\'Exports data from this layer\']',
              ADD_TO_TRACK: '[title=\'Adds selected features (or all features if none are selected) ' +
              'to an existing track.\']',
              CREATE_BUFFER_REGION: '[title=\'Create buffer regions around loaded data\']',
              CREATE_TRACK: '[title=\'Creates a new track by linking selected features (or all ' +
              'features if none are selected) in time order.\']',
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
              },
              ADD_FOLDER: '[title=\'Creates a new folder and adds it to the tree\']',
              ADD_PLACE: '[title=\'Creates a new saved place\']',
              EXPORT_PLACES: '[title=\'Exports Saved Places from the selected location\']',
              REMOVE_ALL: '[title=\'Removes all of the places\']'
            },
            contextMenu: {
              PANEL: '#menu',
              menuOptions: {
                CREATE_BUFFER_REGION: '[title=\'Create buffer regions around loaded data\']',
                EDIT_PLACE: '[title=\'Edit the saved place\']',
                EXPORT_PLACES: '[title=\'Exports Saved Places from the selected location\']',
                REMOVE: '[title=\'Removes the layer\']',
                FEATURE_INFO: '[title=\'Display detailed feature information\']',
                GO_TO: '[title=\'Repositions the map to show the layer\']'
              }
            },
            Accordion: {
              Style: {
                BUTTON: '[title=\'Style controls for the layer(s)\']',
                OPACITY_SLIDER: '[name=\'opacity\'] .ui-slider-handle',
                SIZE_SLIDER: '[name=\'size\'] .ui-slider-handle',
                colorPicker: {
                  BUTTON: '[title=\'Sets the color/shape used to render features\'] [color=\'color\']',
                  SELECTED_COLOR: '.c-colorpalette__selected',
                  Color: {
                    WHITE: '[title=\'#ffffff\']',
                    BLACK: '[title=\'#000000\']',
                    RED: '[title=\'#FF0000\']',
                    ORANGE: '[title=\'#FFA500\']',
                    YELLOW: '[title=\'#FFFF00\']',
                    GREEN: '[title=\'#008000\']',
                    BLUE: '[title=\'#0000FF\']',
                    INDIGO: '[title=\'#4B0082\']',
                    VIOLET: '[title=\'#EE82EE\']'
                  },
                  RESET_BUTTON: '[ng-click=\'palette.reset()\']'
                },
                DROPDOWN: '[ng-model=\'$parent.shape\']',
                Style: {
                  Icon: {
                    ICON_BUTTON: '[ng-model=\'icon\']',
                    ROTATION_CHECKBOX: '.no-text > .fa',
                    ROTATION_DROPDOWN: '[title=\'Sets the data field used for bearing\']'
                  },
                  ellipseWithCenter: {
                    CENTER_DROPDOWN: '[ng-model=\'$parent.centerShape\']',
                    ROTATION_CHECKBOX: '.no-text > .fa',
                    ROTATION_DROPDOWN: '[title=\'Sets the data field used for bearing\']'
                  }
                }
              },
              Label: {
                BUTTON: '[title=\'Configure how labels are displayed for the layer\']',
                colorPicker: {
                  BUTTON: '[title=\'Sets the color/shape used to render features\'] [color=\'color\']',
                  SELECTED_COLOR: '.c-colorpalette__selected',
                  Color: {
                    WHITE: '[title=\'#ffffff\']',
                    BLACK: '[title=\'#000000\']',
                    RED: '[title=\'#FF0000\']',
                    ORANGE: '[title=\'#FFA500\']',
                    YELLOW: '[title=\'#FFFF00\']',
                    GREEN: '[title=\'#008000\']',
                    BLUE: '[title=\'#0000FF\']',
                    INDIGO: '[title=\'#4B0082\']',
                    VIOLET: '[title=\'#EE82EE\']'
                  },
                  RESET_BUTTON: '[ng-click=\'palette.reset()\']'
                },
                SIZE_DROPDOWN: '[name=\'spinner\']',
                ALWAYS_SHOW_LABELS_CHECKBOX: '#showLabels',
                Column: {
                  HANDLE_WILDCARD: '[title=\'Click and Drag to move this label\']',
                  CHECKBOX_WILDCARD: '[ng-model=\'label.showColumn\']',
                  DROPDOWN_WILDCARD: '[title=\'Sets the data field used for labels\']',
                  REMOVE_COLUMN_BUTTON_WILDCARD: '[title=\'Remove this label\']',
                  ADD_COLUMN_BUTTON: '[title=\'Add a label\']',
                  COLUMN_1_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
                  COLUMN_1_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
                  COLUMN_1_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
                  COLUMN_2_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
                  COLUMN_2_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
                  COLUMN_2_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
                  COLUMN_3_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
                  COLUMN_3_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
                  COLUMN_3_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
                  COLUMN_4_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
                  COLUMN_4_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
                  COLUMN_4_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
                  COLUMN_5_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
                  COLUMN_5_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
                  COLUMN_5_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)'
                }
              }
            }
          },
          tileLayer: {
            REMOVE_LAYER_BUTTON_WILDCARD: '[title=\'Remove the layer\']',
            contextMenu: {
              PANEL: '#menu',
              menuOptions: {
                EDIT_PARAMETERS: '[title=\'Edit request parameters for the layer\']',
                IDENTIFY: '[title=\'Identifies a layer on the map\']',
                REFRESH: '[title=\'Refreshes the layer\']',
                REMOVE: '[title=\'Removes the layer\']',
                RENAME: '[title=\'Rename the layer\']',
                SHOW_DESCRIPTION: '[title=\'Gives details about the layer\']'
              }
            },
            Accordion: {
              Style: {
                BUTTON: '[title=\'Style controls for the layer(s)\']',
                OPACITY_SLIDER: '[name=\'opacity\'] .ui-slider-handle',
                OPACITY_RESET_BUTTON: '[title=\'Restore default opacity\']',
                BRIGHTNESS_SLIDER: '[name=\'brightness\'] .ui-slider-handle',
                BRIGHTNESS_RESET_BUTTON: '[title=\'Restore default brightness\']',
                CONTRAST_SLIDER: '[name=\'contrast\'] .ui-slider-handle',
                CONTRAST_RESET_BUTTON: '[title=\'Restore default contrast\']',
                SATURATION_SLIDER: '[name=\'saturation\'] .ui-slider-handle',
                SATURATION_RESET_BUTTON: '[title=\'Restore default saturation\']',
                colorPicker: {
                  BUTTON: '[title=\'Sets the color/shape used to render features\'] [color=\'color\']',
                  SELECTED_COLOR: '.c-colorpalette__selected',
                  Color: {
                    WHITE: '[title=\'#ffffff\']',
                    BLACK: '[title=\'#000000\']',
                    RED: '[title=\'#FF0000\']',
                    ORANGE: '[title=\'#FFA500\']',
                    YELLOW: '[title=\'#FFFF00\']',
                    GREEN: '[title=\'#008000\']',
                    BLUE: '[title=\'#0000FF\']',
                    INDIGO: '[title=\'#4B0082\']',
                    VIOLET: '[title=\'#EE82EE\']'
                  },
                  RESET_BUTTON: '[ng-click=\'palette.reset()\']'
                },
                COLORIZE_CHECKBOX: '#tile_colorize'
              },
              Options: {
                BUTTON: '[title=\'Configure the layer options\']',
                AUTO_REFRESH_DROPDOWN: '[ng-model=\'vector.refresh\']'
              }
            }
          },
          mapLayer: {
            REMOVE_LAYER_BUTTON_WILDCARD: '[title=\'Remove the layer\']',
            STREET_MAP_TILES: ':contains(\'Street Map Tiles\').slick-row',
            WORLD_IMAGERY_TILES: ':contains(\'World Imagery Tiles\').slick-row',
            contextMenu: {
              PANEL: '#menu',
              menuOptions: {
                EDIT_PARAMETERS: '[title=\'Edit request parameters for the layer\']',
                IDENTIFY: '[title=\'Identifies a layer on the map\']',
                REFRESH: '[title=\'Refreshes the layer\']',
                REMOVE: '[title=\'Removes the layer\']',
                RENAME: '[title=\'Rename the layer\']',
                SHOW_DESCRIPTION: '[title=\'Gives details about the layer\']'
              }
            },
            Accordion: {
              Style: {
                BUTTON: '[title=\'Style controls for the layer(s)\']',
                OPACITY_SLIDER: '[name=\'opacity\'] .ui-slider-handle',
                OPACITY_RESET_BUTTON: '[title=\'Restore default opacity\']',
                BRIGHTNESS_SLIDER: '[name=\'brightness\'] .ui-slider-handle',
                BRIGHTNESS_RESET_BUTTON: '[title=\'Restore default brightness\']',
                CONTRAST_SLIDER: '[name=\'contrast\'] .ui-slider-handle',
                CONTRAST_RESET_BUTTON: '[title=\'Restore default contrast\']',
                SATURATION_SLIDER: '[name=\'saturation\'] .ui-slider-handle',
                SATURATION_RESET_BUTTON: '[title=\'Restore default saturation\']'
              },
              Zoom: {
                BUTTON: '[title=\'Zoom controls for the layer(s)\']',
                MIN_ZOOM_SPINNER: '[name=\'minZoom\']',
                MIN_ZOOM_CURRENT_BUTTON: '[title=\'Sets the min zoom to the current zoom level\']',
                MAX_ZOON_SPINNER: '[name=\'maxZoom\']',
                MAX_ZOOM_CURRENT_BUTTON: '[title=\'Sets the max zoom to the current zoom level\']'
              }
            }
          }
        }
      }
    },
    Areas: {
      TAB: '.nav-link:eq(1)',
      GROUP_BY_DROPDOWN: '[ng-model=\'view\']',
      SEARCH_INPUT: '[placeholder=\'Search areas\']',
      CLEAR_BUTTON: '[title=\'Clear the search term\']',
      Tree: {
        AREA_WILDCARD: '.slick-row',
        AREA_NODE_WILDCARD: '.js-node-toggle',
        AREA_NODE_EXPANDED_WILDCARD_CLASS: 'fa-caret-down',
        AREA_NODE_COLLAPSED_WILDCARD_CLASS: 'fa-caret-right',
        AREA_TOGGLE_CHECKBOX_WILDCARD: '[title=\'Show or hide the area\']',
        AREA_IS_ACTIVE_CLASS_WILDCARD: '.c-tristate-on',
        AREA_IS_INACTIVE_CLASS_WILDCARD: '.c-tristate-off',
        SAVE_AREA_BUTTON_WILDCARD: '[ng-click=\'nodeUi.edit()\']',
        REMOVE_AREA_BUTTON_WILDCARD: '[title=\'Remove the area\']',
        AREA_1: '.slick-row:eq(0)',
        AREA_1_SAVE_BUTTON: '[title=\'Save\']:eq(0)',
        AREA_1_REMOVE_BUTTON: '[title=\'Remove the area\']:eq(0)',
        AREA_2: '.slick-row:eq(1)',
        AREA_2_SAVE_BUTTON: '[title=\'Save\']:eq(1)',
        AREA_2_REMOVE_BUTTON: '[title=\'Remove the area\']:eq(1)',
        AREA_3: '.slick-row:eq(2)',
        AREA_3_SAVE_BUTTON: '[title=\'Save\']:eq(2)',
        AREA_3_REMOVE_BUTTON: '[title=\'Remove the area\']:eq(2)',
        AREA_4: '.slick-row:eq(3)',
        AREA_4_SAVE_BUTTON: '[title=\'Save\']:eq(3)',
        AREA_4_REMOVE_BUTTON: '[title=\'Remove the area\']:eq(3)',
        AREA_5: '.slick-row:eq(4)',
        AREA_5_SAVE_BUTTON: '[title=\'Save\']:eq(4)',
        AREA_5_REMOVE_BUTTON: '[title=\'Remove the area\']:eq(4)',
        TEMP_AREA_1: ':contains(\'temp area 1\')',
        TEMP_AREA_2: ':contains(\'temp area 2\')',
        TEMP_AREA_3: ':contains(\'temp area 3\')',
        TEMP_AREA_4: ':contains(\'temp area 4\')',
        TEMP_AREA_5: ':contains(\'temp area 5\')',
        WHOLE_WORLD_AREA: ':contains(\'Whole World\') .slick-cell',
        contextMenu: {
          PANEL: '#menu',
          menuOptions: {
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
        }
      },
      EXPORT_BUTTON: '[ng-click=\'areasCtrl.export()\']',
      Import: {
        BUTTON: '[ng-click=\'areasCtrl.import()\']',
        Menu: {
          BUTTON: '.fa-chevron-down',
          PANEL: '#menu',
          menuOptions: {
            IMPORT_FILE_URL: '[title=\'Import areas from a file or URL\']',
            ENTER_COORDINATES: '[title=\'Enter coordinates to load data for a box, circle, or polygon\']',
            WHOLE_WORLD: '[title=\'Load data for the whole world\']'
          }
        }
      },
      ADVANCED_BUTTON: '[ng-click=\'areasCtrl.launch()\']'
    },
    Filters: {
      TAB: '.nav-link:eq(2)',
      GROUP_BY_DROPDOWN: '[ng-change=\'filtersCtrl.onGroupChange()\']',
      ADD_FILTER_BUTTON: '[title=\'Add a filter\']',
      SEARCH_INPUT: '[placeholder=\'Search...\']',
      CLEAR_BUTTON: '[ng-change=\'filtersCtrl.onSearchTermChange()\']',
      Tree: {
        FILTER_WILDCARD: '.slick-row',
        FILTER_NODE_WILDCARD: '.js-node-toggle',
        FILTER_NODE_EXPANDED_WILDCARD_CLASS: 'fa-caret-down',
        FILTER_NODE_COLLAPSED_WILDCARD_CLASS: 'fa-caret-right',
        FILTER_TOGGLE_CHECKBOX_WILDCARD: '[title=\'Show or hide the filter\']',
        FILTER_IS_ACTIVE_CLASS_WILDCARD: '.c-tristate-on',
        FILTER_IS_INACTIVE_CLASS_WILDCARD: '.c-tristate-off',
        COPY_FILTER_BUTTON_WILDCARD: '[title=\'Copy\']',
        EDIT_FILTER_BUTTON_WILDCARD: '[title=\'Edit\']',
        REMOVE_FILTER_BUTTON_WILDCARD: '[title=\'Remove\']',
        FILTER_1: '.slick-row:eq(0)',
        FILTER_1_COPY_BUTTON: '[title=\'Copy\']:eq(0)',
        FILTER_1_EDIT_BUTTON: '[title=\'Edit\']:eq(0)',
        FILTER_1_REMOVE_BUTTON: '[title=\'Remove\']:eq0()',
        FILTER_2: '.slick-row:eq(1)',
        FILTER_2_COPY_BUTTON: '[title=\'Copy\']:eq(1)',
        FILTER_2_EDIT_BUTTON: '[title=\'Edit\']:eq(1)',
        FILTER_2_REMOVE_BUTTON: '[title=\'Remove\']:eq(1)',
        FILTER_3: '.slick-row:eq(2)',
        FILTER_3_COPY_BUTTON: '[title=\'Copy\']:eq(2)',
        FILTER_3_EDIT_BUTTON: '[title=\'Edit\']:eq(2)',
        FILTER_3_REMOVE_BUTTON: '[title=\'Remove\']:eq(2)',
        NEW_FILTER_1: ':contains(\'New Filter\'):eq(0)',
        NEW_FILTER_2: ':contains(\'New Filter\'):eq(1)',
        NEW_FILTER_3: ':contains(\'New Filter\'):eq(2)',
        contextMenu: {
          PANEL: '#menu',
          menuOptions: {
            HIDE: '[title=\'Hides the filter\']',
            SHOW: '[title=\'Shows the filter\']',
            TURN_FILTER_ON: '[title=\'Apply the filter to all areas for the query\']',
            TURN_FILTER_OFF: '[title=\'Remove the filter from all areas for the query\']',
            REMOVE: '[title=\'Removes the filter\']',
            EXPORT_FILTER: '[title=\'Export the filter\']'
          }
        }
      },
      EXPORT_BUTTON: '[ng-click=\'filtersCtrl.export()\']',
      IMPORT_BUTTON: '[ng-click=\'filtersCtrl.import()\']',
      ADVANCED_BUTTON: '[ng-click=\'filtersCtrl.launch()\']'
    },
    Places: {
      TAB: '.nav-link:eq(3)',
      ADD_FOLDER_BUTTON: '[ng-click=\'places.addFolder()\']',
      ADD_PLACE_BUTTON: '[ng-click=\'places.addPlace()\']',
      EXPAND_ALL_BUTTON: '[title=\'Fully expand the tree from the selected item, or the root if nothing is selected\']',
      COLLAPSE_ALL_BUTTON: '[title=\'Fully collapse the tree from the selected item, or the root if ' +
      'nothing is selected\']',
      Tree: {
        PLACE_WILDCARD: '.slick-row',
        Type: {
          Folder: {
            NODE_WILDCARD: '.js-node-toggle',
            NODE_EXPANDED_WILDCARD_CLASS: 'fa-caret-down',
            NODE_COLLAPSED_WILDCARD_CLASS: 'fa-caret-right',
            TOGGLE_CHECKBOX_WILDCARD: '[title=\'Show or hide the layer\']',
            IS_ACTIVE_CLASS_WILDCARD: 'c-tristate-on',
            IS_INACTIVE_CLASS_WILDCARD: 'c-tristate-off',
            CREATE_FOLDER_BUTTON_WILDCARD: '[title=\'Create a new folder\']',
            CREATE_PLACE_BUTTON_WILDCARD: '[title=\'Create a new place\']',
            EDIT_BUTTON_WILDCARD: '[title=\'Edit the folder\']',
            REMOVE_BUTTON_WILDCARD: '[title=\'Remove the folder\']',
            FOLDER_1: '.slick-row:eq(0)',
            FOLDER_1_CREATE_FOLDER_BUTTON: '[title=\'Create a new folder\']:eq(0)',
            FOLDER_1_CREATE_PLACE_BUTTON: '[title=\'Create a new place\']:eq(0)',
            FOLDER_1_EDIT_FOLDER_BUTTON: '[title=\'Edit the folder\']:eq(0)',
            FOLDER_1_REMOVE_FOLDER_BUTTON: '[title=\'Remove the folder\']:eq(0)',
            FOLDER_2: '.slick-row:eq(1)',
            FOLDER_2_CREATE_FOLDER_BUTTON: '[title=\'Create a new folder\']:eq(1)',
            FOLDER_2_CREATE_PLACE_BUTTON: '[title=\'Create a new place\']:eq(1)',
            FOLDER_2_EDIT_FOLDER_BUTTON: '[title=\'Edit the folder\']:eq(1)',
            FOLDER_2_REMOVE_FOLDER_BUTTON: '[title=\'Remove the folder\']:eq(1)',
            FOLDER_3: '.slick-row:eq(2)',
            FOLDER_3_CREATE_FOLDER_BUTTON: '[title=\'Create a new folder\']:eq(2)',
            FOLDER_3_CREATE_PLACE_BUTTON: '[title=\'Create a new place\']:eq(2)',
            FOLDER_3_EDIT_FOLDER_BUTTON: '[title=\'Edit the folder\']:eq(2)',
            FOLDER_3_REMOVE_FOLDER_BUTTON: '[title=\'Remove the folder\']:eq(2)',
            FOLDER_4: '.slick-row:eq(3)',
            FOLDER_4_CREATE_FOLDER_BUTTON: '[title=\'Create a new folder\']:eq(3)',
            FOLDER_4_CREATE_PLACE_BUTTON: '[title=\'Create a new place\']:eq(3)',
            FOLDER_4_EDIT_FOLDER_BUTTON: '[title=\'Edit the folder\']:eq(3)',
            FOLDER_4_REMOVE_FOLDER_BUTTON: '[title=\'Remove the folder\']:eq(3)',
            FOLDER_5: '.slick-row:eq(4)',
            FOLDER_5_CREATE_FOLDER_BUTTON: '[title=\'Create a new folder\']:eq(4)',
            FOLDER_5_CREATE_PLACE_BUTTON: '[title=\'Create a new place\']:eq(4)',
            FOLDER_5_EDIT_FOLDER_BUTTON: '[title=\'Edit the folder\']:eq(4)',
            FOLDER_5_REMOVE_FOLDER_BUTTON: '[title=\'Remove the folder\']:eq(4)',
            contextMenu: {
              PANEL: '#menu',
              menuOptions: {
                ADD_FOLDER: '[title=\'Creates a new folder and adds it to the tree\']',
                ADD_PLACE: '[title=\'Creates a new saved place\']',
                EDIT_FOLDER: '[title=\'Edit the folder label\']',
                EXPORT_PLACES: '[title=\'Exports Saved Places from the selected location\']',
                REMOVE_ALL: '[title=\'Removes everything under the folder\']'
              }
            }
          },
          Place: {
            TOGGLE_CHECKBOX_WILDCARD: '[title=\'Show or hide the layer\']',
            IS_ACTIVE_CLASS_WILDCARD: 'c-tristate-on',
            IS_INACTIVE_CLASS_WILDCARD: 'c-tristate-off',
            EDIT_BUTTON_WILDCARD: '[title=\'Edit the place\']',
            REMOVE_BUTTON_WILDCARD: '[ng-if=\'nodeUi.canRemove()\']',
            PLACE_1: '.slick-row:eq(0)',
            PLACE_1_EDIT_BUTTON: '[title=\'Edit the place\']:eq(0)',
            PLACE_1_REMOVE_BUTTON: '[ng-if=\'nodeUi.canRemove()\']:eq(0)',
            PLACE_2: '.slick-row:eq(1)',
            PLACE_2_EDIT_BUTTON: '[title=\'Edit the place\']:eq(1)',
            PLACE_2_REMOVE_BUTTON: '[ng-if=\'nodeUi.canRemove()\']:eq(1)',
            PLACE_3: '.slick-row:eq(2)',
            PLACE_3_EDIT_BUTTON: '[title=\'Edit the place\']:eq(2)',
            PLACE_3_REMOVE_BUTTON: '[ng-if=\'nodeUi.canRemove()\']:eq(2)',
            PLACE_4: '.slick-row:eq(3)',
            PLACE_4_EDIT_BUTTON: '[title=\'Edit the place\']:eq(3)',
            PLACE_4_REMOVE_BUTTON: '[ng-if=\'nodeUi.canRemove()\']:eq(3)',
            PLACE_5: '.slick-row:eq(4)',
            PLACE_5_EDIT_BUTTON: '[title=\'Edit the place\']:eq(4)',
            PLACE_5_REMOVE_BUTTON: '[ng-if=\'nodeUi.canRemove()\']:eq(4)',
            contextMenu: {
              PANEL: '#menu',
              menuOptions: {
                CREATE_BUFFER_REGION: '[title=\'Creates buffer regions around loaded data\']',
                EDIT_PLACE: '[title=\'Edit the saved place\']',
                EXPORT_PLACES: '[title=\'Exports Saved Places from the selected location\']',
                REMOVE: '[title=\'Removes the place\']',
                FEATURE_INFO: '[title=\'Display detailed feature information\']',
                GO_TO: '[title=\'Repositions the map to display features at this level of the tree\']'
              }
            }
          }
        }
      },
      EXPORT_BUTTON: '[title=\'Export places to KML\']',
      IMPORT_BUTTON: '[title=\'Import places only\']'
    }
  }
};

exports.legendDialog = {
  DIALOG_TEXT: '[ng-if=\'mainCtrl.legend\']',
  SETTINGS_BUTTON: '[title=\'Open settings\']',
  DIALOG_CLOSE: '[title=\'Close the legend\']'
};

exports.locationFormatsDialog = {
  DIALOG: '[label=\'Location Formats\']',
  DIALOG_HEADER: '[title=\'Location Formats\']',
  DIALOG_CLOSE: '[label=\'Location Formats\'] .close',
  DIALOG_TEXT: '[label=\'Location Formats\'] .modal-body',
  CLOSE_BUTTON: '[ng-click=\'th.close()\']'
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
    menuOptions: {
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
  }
};

exports.modifyAreaDialog = {
  DIALOG: '#modifyArea',
  DIALOG_HEADER: '[title=\'Modify Area...\']',
  DIALOG_CLOSE: '#modifyArea .close',
  AREA_TO_MODIFY_DROPDOWN: '[ng-model=\'area\']:eq(0)',
  AREA_TO_MODIFY_BADGE: '[x-title=\'helpTitle\']:eq(0)',
  Operation: {
    ADD_RADIO_BUTTON: '[value=\'Add\']',
    REMOVE_RADIO_BUTTON: '[value=\'Remove\']',
    INTERSECTION_RADIO_BUTTON: '[value=\'Intersect\']',
    BADGE: '[x-title=\'modarea.getPopoverTitle(op)\']'
  },
  AREA_TO_ADD_DROPDOWN: '[ng-model=\'area\']:eq(1)',
  AREA_TO_ADD_BADGE: '[x-title=\'helpTitle\']:eq(1)',
  REPLACE_AREA_CHECKBOX: '[name=\'replace\']',
  REPLACE_AREA_BADGE: '[x-content=\'modarea.help.replace\']',
  OK_BUTTON: '[ng-click=\'modarea.confirm()\']',
  CANCEL_BUTTON: '[ng-click=\'modarea.cancel()\']'
};

exports.openSphereCapabilitiesDialog = {
  DIALOG: '[label=\'OpenSphere Capabilities\']',
  DIALOG_HEADER: '[title=\'OpenSphere Capabilities\']',
  DIALOG_CLOSE: '[label=\'OpenSphere Capabilities\'] .close',
  Tree: {
    CAPABILITY_WILDCARD: '[label=\'OpenSphere Capabilities\'] .slick-row',
    CAPABILITY_NODE_WILDCARD: '.js-node-toggle',
    CAPABILITY_NODE_EXPANDED_WILDCARD_CLASS: 'fa-caret-down',
    CAPABILITY_NODE_COLLAPSED_WILDCARD_CLASS: 'fa-caret-right',
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
  DESCRIPTION_TEXT: 'section',
  SEARCH_INPUT: '[placeholder=\'Search features\']',
  CLOSE_BUTTON: '[ng-click=\'setCon.close()\']'
};

exports.renameLayerDialog = {
  DIALOG: '[label=\'Rename Layer\']',
  DIALOG_HEADER: '[title=\'Rename Layer\']',
  LAYER_NAME_INPUT: '[name=\'title\']',
  OK_BUTTON: '[ng-class=\'yesButtonClass\']',
  CANCEL_BUTTON: '[ng-class=\'noButtonClass\']'
};

exports.resetSettingsDialog = {
  DIALOG: '[label=\'Reset Settings\']',
  DIALOG_HEADER: '[title=\'Reset Settings\']',
  CLEAR_AND_RELOAD_BUTTON: '[ng-class=\'yesButtonClass\']',
  CANCEL_BUTTON: '[ng-class=\'noButtonClass\']'
};

exports.saveStateDialog = {
  DIALOG: '#stateExport',
  DIALOG_HEADER: '[title=\'Save State\']',
  DIALOG_CLOSE: '#stateExport .close',
  NAME_INPUT: '[name=\'title\']',
  SAVE_TO_DROPDOWN: '[name=\'persister\']',
  DESCRIPTION_INPUT: '[name=\'desc\']',
  TAGS_INPUT: '[name=\'tags\']',
  CHOOSE_PARTS_CHECKBOX: '[name=\'showOptions\']',
  OK_BUTTON: '[ng-click=\'stateForm.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'stateForm.close()\']'
};

exports.saveToPlacesDialog = {
  DIALOG: '#savePlaces',
  DIALOG_HEADER: '[title=\'Save to Places\']',
  DIALOG_CLOSE: '#savePlaces .close',
  TITLE_COLUMN_DROPDOWN: '[ng-model=\'config.titleColumn\']',
  TITLE_COLUMN_BADGE: '[x-content=\'help.title\']',
  TITLE_INPUT: '[name=\'title\']',
  TITLE_BADGE: '[ng-class=\'popoverctrl.icon\']',
  DESCRIPTION_COLUMN_DROPDOWN: '[ng-model=\'config.descColumn\']',
  DESCRIPTION_COLUMN_BADGE: '[ng-if=\'help.descColumn\']',
  DESCRIPTION_INPUT: '[name=\'description\']',
  DESCRIPTION_BADGE: '[ng-if=\'help.description\']',
  TAGS_COLUMN_DROPDOWN: '[ng-model=\'config.tagsColumn\']',
  TAGS_COLUMN_BADGE: '[ng-if=\'help.tagsColumn\']',
  TAGS_INPUT: '[name=\'tags\']',
  TAGS_BADGE: '[ng-if=\'help.tags\']',
  USE_SELECTED_FEATURES_CHECKBOX: '[name=\'ctrl.useSelected\']',
  SOURCE_CHECKBOX_WILDCARD: '#savePlaces .custom-checkbox',
  OK_BUTTON: '[ng-click=\'ctrl.confirm()\']',
  CANCEL_BUTTON: '[ng-click=\'ctrl.cancel()\']'
};

exports.setLabelDialog = {
  DIALOG: '#importActionConfig',
  DIALOG_HEADER: '[title=\'Set Label\']',
  colorPicker: {
    BUTTON: '#importActionConfig [ng-click=\'colorPicker.togglePopup()\']',
    SELECTED_COLOR: '.c-colorpalette__selected',
    Color: {
      WHITE: '[title=\'#ffffff\']',
      BLACK: '[title=\'#000000\']',
      RED: '[title=\'#FF0000\']',
      ORANGE: '[title=\'#FFA500\']',
      YELLOW: '[title=\'#FFFF00\']',
      GREEN: '[title=\'#008000\']',
      BLUE: '[title=\'#0000FF\']',
      INDIGO: '[title=\'#4B0082\']',
      VIOLET: '[title=\'#EE82EE\']'
    },
    RESET_BUTTON: '[ng-click=\'palette.reset()\']'
  },
  SIZE_DROPDOWN: '#importActionConfig [max=\'labelCtrl.maxSize\']',
  Column: {
    HANDLE_WILDCARD: '[title=\'Click and Drag to move this label\']',
    CHECKBOX_WILDCARD: '[ng-model=\'label.showColumn\']',
    DROPDOWN_WILDCARD: '[title=\'Sets the data field used for labels\']',
    REMOVE_COLUMN_BUTTON_WILDCARD: '[title=\'Remove this label\']',
    ADD_COLUMN_BUTTON: '[title=\'Add a label\']',
    COLUMN_1_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
    COLUMN_1_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
    COLUMN_1_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
    COLUMN_2_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
    COLUMN_2_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
    COLUMN_2_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
    COLUMN_3_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
    COLUMN_3_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
    COLUMN_3_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
    COLUMN_4_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
    COLUMN_4_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
    COLUMN_4_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)',
    COLUMN_5_CHECKBOX: '[ng-model=\'label.showColumn\']:eq(0)',
    COLUMN_5_DROPDOWN: '[title=\'Sets the data field used for labels\']eq:(0)',
    COLUMN_5_REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']eq:(0)'
  },
  ADD_CUSTOM_LABEL_CHECKBOX: '[title=\'Add a custom label to each feature\']',
  COLUMN_NAME_INPUT: '[name=\'name\']',
  VALUE_INPUT: '[name=\'value\']',
  OK_BUTTON: '[ng-class=\'yesButtonClass\']',
  CANCEL_BUTTON: '[ng-class=\'noButtonClass\']'
};

exports.setSoundDialog = {
  DIALOG: '#importActionConfig',
  DIALOG_HEADER: '[title=\'Set Sound\']',
  SOUND_DROPDOWN: '[ng-model=\'ctrl.sound\']',
  DELAY_DROPDOWN: '#importActionConfig [name=\'spinner\']',
  DELAY_BADGE: '[content=\'ctrl.help\']',
  OK_BUTTON: '[ng-class=\'yesButtonClass\']',
  CANCEL_BUTTON: '[ng-class=\'noButtonClass\']'
};

exports.setStyleDialog = {
  DIALOG: '#importActionConfig',
  DIALOG_HEADER: '[title=\'Set Style\']',
  OPACITY_SLIDER: '[name=\'opacity\'] .ui-slider-handle',
  SIZE_SLIDER: '[name=\'size\'] .ui-slider-handle',
  Style: {
    Icon: {
      ICON_BUTTON: '[ng-model=\'icon\']',
      ROTATION_CHECKBOX: '.no-text > .fa',
      ROTATION_DROPDOWN: '[title=\'Sets the data field used for bearing\']'
    },
    LineOfBearing: {
      BEARING_DROPDOWN: '[title=\'Sets the data field used for bearing\']',
      Manual: {
        RADIOBUTTON: '#lengthManual',
        INPUT: '#lengthColumn',
        SLIDER: '[name=\'length\']',
        UNITS_DROPDOWN: '.ml-1[title=\'Sets the units field used for length\']'
      },
      Column: {
        RADIOBUTTON: '#lengthColumn',
        DROPDOWN: '[title=\'Sets the data field used for length\']',
        UNITS_DROPDOWN: '[title=\'Sets the data field used for length\']',
        MULTIPLER_INPUT: '[ng-model=\'columnLength\']'
      },
      showArrow: {
        CHECKBOX: '#showArrow',
        SIZE_INPUT: '[max=\'maxSize[ctrl.arrowUnits]\']',
        UNITS_DROPDOWN: '[title=\'Sets the units field used for arrow size\']'
      },
      showEllipse: {
        CHECKBOX: '#showEllipse',
        SHOW_ELLIPSOIDS_CHECKBOX: '[name=\'showEllipsoids\']',
        SHOW_GROUND_REF_CHECKBOX: '[name=\'showGroundReference\']'
      },
      showError: {
        CHECKBOX: '#showError',
        TIP_BUTTON: '[x-content=\'ctrl.helpText\']',
        TIP_POPUP: '.popover',
        BEARING_ERR_DROPDOWN: '[title=\'Sets the data field used for bearing error\']',
        BEARING_ERR_MULTIPLYER_INPUT: '[ng-model=\'bearingErrorMultiplier\']',
        LENGTH_ERR_DROPDOWN: '[title=\'Sets the data field used for length error\']',
        LENGTH_ERR_UNITS_DROPDOWN: '[ng-model=\'ctrl.lengthErrorUnits\']',
        LENGTH_ERR_MULTIPLER_INPUT: '[ng-model=\'lengthErrorMultiplier\']'
      }
    },
    LineOfBearingWithCenter: {
      CENTER_DROPDOWN: '[ng-model=\'$parent.centerShape\']',
      BEARING_DROPDOWN: '[title=\'Sets the data field used for bearing\']',
      Manual: {
        RADIOBUTTON: '#lengthManual',
        INPUT: '#lengthColumn',
        SLIDER: '[name=\'length\']',
        UNITS_DROPDOWN: '.ml-1[title=\'Sets the units field used for length\']'
      },
      Column: {
        RADIOBUTTON: '#lengthColumn',
        DROPDOWN: '[title=\'Sets the data field used for length\']',
        UNITS_DROPDOWN: '[title=\'Sets the data field used for length\']',
        MULTIPLER_INPUT: '[ng-model=\'columnLength\']'
      },
      showArrow: {
        CHECKBOX: '#showArrow',
        SIZE_INPUT: '[max=\'maxSize[ctrl.arrowUnits]\']',
        UNITS_DROPDOWN: '[title=\'Sets the units field used for arrow size\']'
      },
      showEllipse: {
        CHECKBOX: '#showEllipse',
        SHOW_ELLIPSOIDS_CHECKBOX: '[name=\'showEllipsoids\']',
        SHOW_GROUND_REF_CHECKBOX: '[name=\'showGroundReference\']'
      },
      showError: {
        CHECKBOX: '#showError',
        TIP_BUTTON: '[x-content=\'ctrl.helpText\']',
        TIP_POPUP: '.popover',
        BEARING_ERR_DROPDOWN: '[title=\'Sets the data field used for bearing error\']',
        BEARING_ERR_MULTIPLYER_INPUT: '[ng-model=\'bearingErrorMultiplier\']',
        LENGTH_ERR_DROPDOWN: '[title=\'Sets the data field used for length error\']',
        LENGTH_ERR_UNITS_DROPDOWN: '[ng-model=\'ctrl.lengthErrorUnits\']',
        LENGTH_ERR_MULTIPLER_INPUT: '[ng-model=\'lengthErrorMultiplier\']'
      }
    }
  },
  OK_BUTTON: '[ng-class=\'yesIcon\']',
  CANCEL_BUTTON: '[ng-class=\'noButtonClass\']'
};

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
        NODE_WILDCARD: '.js-node-toggle',
        NODE_EXPANDED_WILDCARD_CLASS: 'fa-caret-down',
        NODE_COLLAPSED_WILDCARD_CLASS: 'fa-caret-right',
        ROW_WILDCARD: '[label=\'Settings\'] .container-fluid .slick-cell',
        EDIT_BUTTON_WILDCARD: '[title=\'Edit the column mapping\']',
        REMOVE_BUTTON_WILDCARD: '[title=\'Remove the column mapping\']',
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
      SERVER_WILDCARD: '[ng-repeat=\'item in data\']',
      SERVER_CHECKBOX_WILDCARD: '[ng-change=\'servers.update()\']',
      SERVER_ONLINE_BADGE_WILDCARD: '[title=\'Online\']',
      SERVER_OFFLINE_BADGE_WILDCARD: '[title=\'Offline\']',
      EDIT_SERVER_BUTTON_WILDCARD: '[title=\'Edit server\']',
      DELETE_SERVER_BUTTON_WILDCARD: '[title=\'Delete server\']',
      REFRESH_SERVER_BUTTON_WILDCARD: '[title=\'Refresh server\']',
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
          colorPicker: {
            BUTTON: '[title=\'Sets the color of include areas\']',
            SELECTED_COLOR: '.c-colorpalette__selected',
            Color: {
              WHITE: '[title=\'#ffffff\']',
              BLACK: '[title=\'#000000\']',
              RED: '[title=\'#FF0000\']',
              ORANGE: '[title=\'#FFA500\']',
              YELLOW: '[title=\'#FFFF00\']',
              GREEN: '[title=\'#008000\']',
              BLUE: '[title=\'#0000FF\']',
              INDIGO: '[title=\'#4B0082\']',
              VIOLET: '[title=\'#EE82EE\']'
            },
            RESET_BUTTON: '[ng-click=\'palette.reset()\']'
          },
          WIDTH_SLIDER: '[value=\'area.inWidth\']'
        },
        excludeOptions: {
          colorPicker: {
            BUTTON: '[title=\'Sets the color of exclude areas\']',
            SELECTED_COLOR: '.c-colorpalette__selected',
            Color: {
              WHITE: '[title=\'#ffffff\']',
              BLACK: '[title=\'#000000\']',
              RED: '[title=\'#FF0000\']',
              ORANGE: '[title=\'#FFA500\']',
              YELLOW: '[title=\'#FFFF00\']',
              GREEN: '[title=\'#008000\']',
              BLUE: '[title=\'#0000FF\']',
              INDIGO: '[title=\'#4B0082\']',
              VIOLET: '[title=\'#EE82EE\']'
            },
            RESET_BUTTON: '[ng-click=\'palette.reset()\']'
          },
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
          colorPicker: {
            BUTTON: '[title=\'Change the legend background color\']',
            SELECTED_COLOR: '.c-colorpalette__selected',
            Color: {
              WHITE: '[title=\'#ffffff\']',
              BLACK: '[title=\'#000000\']',
              RED: '[title=\'#FF0000\']',
              ORANGE: '[title=\'#FFA500\']',
              YELLOW: '[title=\'#FFFF00\']',
              GREEN: '[title=\'#008000\']',
              BLUE: '[title=\'#0000FF\']',
              INDIGO: '[title=\'#4B0082\']',
              VIOLET: '[title=\'#EE82EE\']'
            }
          },
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

exports.shpImportDialog = {
  DIALOG: '[label=\'SHP Import\']',
  DIALOG_HEADER: '[title=\'SHP Import\']',
  DIALOG_CLOSE: '[label=\'SHP Import\'] .close',
  Tabs: {
    Time: {
      FORMAT_HELP_BUTTON: '[title=\'Help for custom date and time formats\']',
      noTime: {
        RADIO_BUTTON: '[name=\'timeTypeRadios\']:eq(0)'
      },
      Instant: {
        RADIOBUTTON: '[value=\'instant\']',
        Type: {
          DROPDOWN: '[ng-model=\'model.dateType\']',
          dateTime: {
            DATE_DROPDOWN: '[ng-model=\'model.dateColumn\']',
            FORMAT_DROPDOWN: '[ng-change=\'tiUI.onDateFormat()\']',
            CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']'
          },
          separateDateTime: {
            DATE_DROPDOWN: '[ng-change=\'tiUI.onDateColumn()\']',
            DATE_FORMAT_DROPDOWN: '[ng-model=\'tiUI.dateFormat\']',
            DATE_CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']',
            TIME_DROPDOWN: '[ng-model=\'model.timeColumn\']',
            TIME_FORMAT_DROPDOWN: '[ng-model=\'tiUI.timeFormat\']',
            TIME_CUSTOM_INPUT: '[ng-model=\'model.timeFormat\']'
          },
          dateOnly: {
            DATE_DROPDOWN: '[ng-model=\'model.dateColumn\']',
            FORMAT_DROPDOWN: '[ng-change=\'tiUI.onDateFormat()\']',
            CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']'
          },
          SAMPLE_TEXT: '.d-block:eq(0)',
          RESULT_TEXT: '.d-block:eq(1)'
        }
      },
      timeRange: {
        RADIOBUTTON: '[value=\'range\']',
        Start: {
          Type: {
            DROPDOWN: '[ng-model=\'model.dateType\']:eq(0)',
            dateTime: {
              DATE_DROPDOWN: '[ng-model=\'model.dateColumn\']:eq(0)',
              FORMAT_DROPDOWN: '[ng-change=\'tiUI.onDateFormat()\']:eq(0)',
              CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']:eq(0)'
            },
            separateDateTime: {
              DATE_DROPDOWN: '[ng-change=\'tiUI.onDateColumn()\']:eq(0)',
              DATE_FORMAT_DROPDOWN: '[ng-model=\'tiUI.dateFormat\']:eq(0)',
              DATE_CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']:eq(0)',
              TIME_DROPDOWN: '[ng-model=\'model.timeColumn\']:eq(0)',
              TIME_FORMAT_DROPDOWN: '[ng-model=\'tiUI.timeFormat\']:eq(0)',
              TIME_CUSTOM_INPUT: '[ng-model=\'model.timeFormat\']:eq(0)'
            },
            dateOnly: {
              DATE_DROPDOWN: '[ng-model=\'model.dateColumn\']:eq(0)',
              FORMAT_DROPDOWN: '[ng-change=\'tiUI.onDateFormat()\']:eq(0)',
              CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']:eq(0)'
            },
            SAMPLE_TEXT: '.d-block:eq(0)',
            RESULT_TEXT: '.d-block:eq(1)'
          }
        },
        End: {
          Type: {
            DROPDOWN: '[ng-model=\'model.dateType\']:eq(1)',
            dateTime: {
              DATE_DROPDOWN: '[ng-model=\'model.dateColumn\']:eq(1)',
              FORMAT_DROPDOWN: '[ng-change=\'tiUI.onDateFormat()\']:eq(1)',
              CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']:eq(1)'
            },
            separateDateTime: {
              DATE_DROPDOWN: '[ng-change=\'tiUI.onDateColumn()\']:eq(1)',
              DATE_FORMAT_DROPDOWN: '[ng-model=\'tiUI.dateFormat\']:eq(1)',
              DATE_CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']:eq(1)',
              TIME_DROPDOWN: '[ng-model=\'model.timeColumn\']:eq(1)',
              TIME_FORMAT_DROPDOWN: '[ng-model=\'tiUI.timeFormat\']:eq(1)',
              TIME_CUSTOM_INPUT: '[ng-model=\'model.timeFormat\']:eq(1)'
            },
            dateOnly: {
              DATE_DROPDOWN: '[ng-model=\'model.dateColumn\']:eq(1)',
              FORMAT_DROPDOWN: '[ng-change=\'tiUI.onDateFormat()\']:eq(1)',
              CUSTOM_INPUT: '[ng-model=\'model.dateFormat\']:eq(1)'
            },
            SAMPLE_TEXT: '.d-block:eq(0)',
            RESULT_TEXT: '.d-block:eq(1)'
          }
        }
      },
      PREVIEW_DATA_TEXT: '[x-data=\'config.preview\']'
    },
    Options: {
      LAYER_TITLE_INPUT: '[name=\'title\']',
      DESCRIPTION_INPUT: '[name=\'desc\']',
      TAGS_INPUT: '[name=\'tags\']',
      COLOR_PICKER: '[name=\'color\']'
    }
  },
  PREV_BUTTON: '[title=\'Previous step\']',
  NEXT_BUTTON: '[title=\'Next step\']',
  DONE_BUTTON: '[ng-click=\'wiz.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'wiz.cancel()\']'
};

exports.statusBar = {
  PANEL: '.o-navbottom',
  ALTITUDE_TEXT: '.altitude-text',
  ZOOM_TEXT: '.zoom-text',
  Scale: {
    BAR: '.ol-scale-line',
    Menu: {
      PANEL: '#menu',
      menuOptions: {
        IMPERIAL: '[title=\'Switches to Imperial\']',
        METRIC: '[title=\'Switches to Metric\']',
        NAUTICAL: '[title=\'Switches to Nautical\']',
        NAUTICAL_MILES_ONLY: '[title=\'Switches to Nautical Miles Only\']',
        MILES_ONLY: '[title=\'Switches to Miles Only\']',
        YARDS_ONLY: '[title=\'Switches to Yards Only\']',
        FEET_ONLY: '[title=\'Switches to Feet Only\']'
      }
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

exports.sunAndMoonDialog = {
  DIALOG: '#suncalc',
  DIALOG_HEADER: '[title=\'Sun and Moon Info\']',
  DIALOG_CLOSE: '#suncalc .close',
  COORDINATES_TEXT: '[ng-bind-html=\'simpleLocationCtrl.location\']',
  DD_BUTTON: '[title=\'Display in Decimal Degrees\']',
  DMS_BUTTON: '[title=\'Display in Degrees Minutes Seconds\']',
  DDM_BUTTON: '[title=\'Display in Degrees Decimal Minutes\']',
  MGRS_BUTTON: '[title=\'Display in Military Grid Reference System\']',
  DATE_TIME_TEXT: 'div.ng-binding.mb-2',
  OK_BUTTON: '[ng-click=\'ctrl.close()\']'
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
      menuOptions: {
        ADD_DATA: '[title=\'Browse the data catalog\']',
        OPEN_FILE_OR_URL: '[title=\'Import data from a local file or a URL\']',
        ADD_CESIUM_ION_ASSET: '[title=\'Loads a Cesium Ion asset in 3D mode\']',
        RECENT_STREET_MAP: ':contains(\'Street Map (Map)\').text-truncate',
        RECENT_WORLD_IMAGERY: ':contains(\'World Imagery (Map)\').text-truncate'
      },
      Recent: {
        DATA_WILDCARD: '[role=\'menuitem\']',
        DATA_1: '[role=\'menuitem\']:eq(3)',
        DATA_2: '[role=\'menuitem\']:eq(4)',
        DATA_3: '[role=\'menuitem\']:eq(5)',
        DATA_4: '[role=\'menuitem\']:eq(6)',
        DATA_5: '[role=\'menuitem\']:eq(7)'
      }
    }
  },
  LAYERS_TOGGLE_BUTTON: '[title=\'View Layers\']',
  Drawing: {
    BUTTON: '[title=\'Draws a box on the map for queries, zoom, and selection\']',
    BUTTON_IS_ACTIVE_CLASS: 'active',
    Menu: {
      BUTTON: '[ng-click=\'drawControls.toggleMenu()\']',
      PANEL: '#menu',
      menuOptions: {
        BOX: ':contains(\'Box\')[role=\'menuitem\']',
        CIRCLE: ':contains(\'Circle\')[role=\'menuitem\']',
        POLYGON: ':contains(\'Polygon\')[role=\'menuitem\']',
        LINE: ':contains(\'Line\')[role=\'menuitem\']',
        CHOOSE_AREA: ':contains(\'Choose Area\')[role=\'menuitem\']',
        ENTER_COORDINATES: ':contains(\'Enter Coordinates\')[role=\'menuitem\']',
        WHOLE_WORLD: ':contains(\'Whole World\')[role=\'menuitem\']'
      }
    }
  },
  Measure: {
    BUTTON: '#measureButton',
    BUTTON_IS_ACTIVE_CLASS: 'active',
    Menu: {
      BUTTON: '.btn-secondary.dropdown-toggle-split[ng-click=\'ctrl.openMenu()\']',
      PANEL: '#menu',
      menuOptions: {
        MEASURE_GEODESIC: '[title=\'Measures the shortest distance between two points (variable bearing).\']',
        MEASURE_RHUMB_LINE: '[title=\'Measures the path of constant bearing between two points.\']'
      }
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
      menuOptions: {
        STATE: '[title=\'Save the application state\']',
        SCREENSHOT: '[title=\'Save a screenshot\']'
      }
    }
  },
  States: {
    Menu: {
      BUTTON: '[title=\'State options\']',
      PANEL: '#menu',
      menuOptions: {
        IMPORT_STATE: '[title=\'Import a state from a local file or a URL\']',
        SAVE_STATE: '[title=\'Save the application state\']',
        DISABLE_STATES: '[title=\'Disable all active application states\']'
      }
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
        SEARCH_WILDCARD: '[ng-repeat=\'recent in searchBox.recentSearches\']',
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
        PANEL_WILDCARD: '.card',
        HEADER_WILDCARD: '.card-header',
        SUBTITLE_WILDCARD: '.card-subtitle',
        BODY_WILDCARD: '.card-body',
        REMOVE_BUTTON_WILDCARD: '.card :contains(\'Remove\') > button',
        ADD_BUTTON_WILDCARD: '.card :contains(\'Add\') > button',
        GO_TO_BUTTON_WILDCARD: '.card [title=\'View the result on the map\']'
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
      menuOptions: {
        ABOUT: '[title=\'About OpenSphere\']',
        CONTROLS: '[title=\'Keyboard and mouse controls\']',
        SHOW_TIPS: '[title=\'Reset help tips, and show the initial set of tips\']',
        OPENSPHERE_CAPABILITIES: '[title=\'Display the OpenSphere Capabilities\']',
        VIEW_ALERTS: '[title=\'Display the alert log\']',
        VIEW_LOG: '[title=\'Display the application log\']',
        RESET_SETTINGS: '[evt-type=\'displayClearLocalStorage\']'
      }
    }
  }
};

exports.trackNameDialog = {
  DIALOG: '[label=\'Track Name\']',
  DIALOG_HEADER: '[title=\'Track Name\']',
  TRACK_NAME_INPUT: '[name=\'title\']',
  OK_BUTTON: '[ng-class=\'yesButtonClass\']',
  CANCEL_BUTTON: '[ng-class=\'noButtonClass\']'
};

exports.welcomeToOpenSphereDialog = {
  DIALOG: '.js-onboarding__popover',
  DIALOG_HEADER: '.popover-header',
  DIALOG_CLOSE: '.js-onboarding__popover .close',
  DESCRIPTION_TEXT: '[ng-bind-html=\'ngOnboardCtrl.description\']',
  STOP_SHOWING_TIPS_BUTTON: '[ng-click=\'ngOnboardCtrl.stopShowing()\']',
  NEXT_BUTTON: '[ng-click=\'ngOnboardCtrl.next()\']'
};
