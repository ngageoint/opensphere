exports.annotationOptions = {
  SHOW_ANNOTATION_CHECKBOX: '[ng-attr-for=\'showAnnotation{{ctrl.uid}}\']',
  SHOW_NAME_CHECKBOX: '[ng-attr-for=\'showAnnotationName{{ctrl.uid}}\']',
  SHOW_DESCRIPTION_CHECKBOX: '[ng-attr-for=\'showAnnotationDescription{{ctrl.uid}}\']',
  SHOW_DEFAULTTAILTYPE_RADIOBUTTON: '[ng-attr-for=\'showAnnotationDefaultTail{{ctrl.uid}}\']',
  SHOW_NOTAILTYPE_RADIOBUTTON: '[ng-attr-for=\'showAnnotationNoTail{{ctrl.uid}}\']',
  SHOW_LINETAILTYPE_RADIOBUTTON: '[ng-attr-for=\'showAnnotationLineTail{{ctrl.uid}}\']'
};

exports.colorPicker = {
  BUTTON: '[name=\'color\']',
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
};

exports.columnAssociationDialog = {
  DIALOG: '#columnmappingform',
  DIALOG_CLOSE: '#columnmappingform .close',
  NAME_INPUT: '[name=\'name\']',
  DESCRIPTION_INPUT: '[name=\'description\']',
  ADD_ASSOCIATION_BUTTON: '[ng-click=\'cmFormCtrl.add()\']',
  Associations: {
    LAYER_DROPDOWN: '.select2-chosen',
    COLUMN_DROPDOWN: '.select2-chosen',
    REMOVE_EXPRESSION_BUTTON: '[title=\'Remove this expression\']',
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

exports.Grid = {
  GRID: '.slick-grid',
  HEADER_ROW: '.slick-header',
  HEADER_CELL_1: '.slick-header-column:eq(0)',
  HEADER_CELL_2: '.slick-header-column:eq(1)',
  HEADER_CELL_3: '.slick-header-column:eq(2)',
  HEADER_CELL_4: '.slick-header-column:eq(3)',
  HEADER_CELL_5: '.slick-header-column:eq(4)',
  HEADER_CELL_6: '.slick-header-column:eq(5)',
  HEADER_CELL_7: '.slick-header-column:eq(6)',
  HEADER_CELL_8: '.slick-header-column:eq(7)',
  HEADER_CELL_9: '.slick-header-column:eq(8)',
  HEADER_CELL_10: '.slick-header-column:eq(9)',
  HEADER_CELL_11: '.slick-header-column:eq(10)',
  HEADER_CELL_12: '.slick-header-column:eq(11)',
  HEADER_CELL_13: '.slick-header-column:eq(12)',
  HEADER_CELL_14: '.slick-header-column:eq(13)',
  HEADER_CELL_15: '.slick-header-column:eq(14)',
  ROWS: '.slick-row',
  ROW_IS_SELECTED_CLASS: 'selected',
  ROW_1: '.slick-row:eq(0)',
  ROW_2: '.slick-row:eq(1)',
  ROW_3: '.slick-row:eq(2)',
  ROW_4: '.slick-row:eq(3)',
  ROW_5: '.slick-row:eq(4)',
  ROW_6: '.slick-row:eq(5)',
  ROW_7: '.slick-row:eq(6)',
  ROW_8: '.slick-row:eq(7)',
  ROW_9: '.slick-row:eq(8)',
  ROW_10: '.slick-row:eq(9)',
  CELLS: '.slick-cell',
  CELL_1: '.slick-cell:eq(0)',
  CELL_2: '.slick-cell:eq(1)',
  CELL_3: '.slick-cell:eq(2)',
  CELL_4: '.slick-cell:eq(3)',
  CELL_5: '.slick-cell:eq(4)',
  CELL_6: '.slick-cell:eq(5)',
  CELL_7: '.slick-cell:eq(6)',
  CELL_8: '.slick-cell:eq(7)',
  CELL_9: '.slick-cell:eq(8)',
  CELL_10: '.slick-cell:eq(9)',
  CELL_11: '.slick-cell:eq(10)',
  CELL_12: '.slick-cell:eq(11)',
  CELL_13: '.slick-cell:eq(12)',
  CELL_14: '.slick-cell:eq(13)',
  CELL_15: '.slick-cell:eq(14)'
};

exports.layerStyle = {
  BUTTON: '[title=\'Style controls for the layer(s)\']',
  OPACITY_SLIDER: '[name=\'opacity\'] .ui-slider-handle',
  SIZE_SLIDER: '[name=\'size\'] .ui-slider-handle',
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
      CENTER_DROPDOWN: '[ng-model=\'$parent.centerShape\']',
      ROTATION_CHECKBOX: '.no-text > .fa',
      ROTATION_DROPDOWN: '[title=\'Sets the data field used for bearing\']',
      SEMI_MAJOR_INPUT: '[name=\'semiMajor\']',
      SEMI_MAJOR_UNITS_DROPDOWN: '[ng-model=\'ctrl.semiMajorUnits\']',
      SEMI_MAJOR_AXIS_BADGE: '[data-title=\'"Semi-Major Axis"\']',
      SEMI_MINOR_INPUT: '[name=\'semiMinor\']',
      SEMI_MINOR_UNITS_DROPDOWN: '[ng-model=\'ctrl.semiMinorUnits\']',
      SEMI_MINOR_AXIS_BADGE: '[data-title=\'"Semi-Minor Axis"\']',
      ORIENTATION_INPUT: '[name=\'orientation\']',
      ELLIPSE_ORIENTATION_BADGE: '[data-title=\'"Ellipse Orientation"\']',
      ICON_BUTTON: '[ng-model=\'icon\']',
      ROTATION_INPUT: '[name=\'iconRotation\']',
      ICON_ROTATION_BADGE: '[data-title=\'"Icon Rotation"\']'
    }
  }
};

exports.layerLabel = {
  BUTTON: '[title=\'Configure how labels are displayed for the layer\']',
  SIZE_DROPDOWN: '[name=\'spinner\']',
  ALWAYS_SHOW_LABELS_CHECKBOX: '#showLabels',
  Column: {
    HANDLE: '[title=\'Click and Drag to move this label\']',
    CHECKBOX: '[ng-model=\'label.showColumn\']',
    DROPDOWN: '[title=\'Sets the data field used for labels\']',
    REMOVE_COLUMN_BUTTON: '[title=\'Remove this label\']',
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
};

exports.Options = {
  LAYER_TITLE_INPUT: '[name=\'title\']',
  DESCRIPTION_INPUT: '[name=\'desc\']',
  TAGS_INPUT: '[name=\'tags\']'
};

exports.placeDialog = {
  DIALOG: '#placemarkEdit',
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
  OK_BUTTON: '[ng-class=\'yesButtonClass\']',
  CANCEL_BUTTON: '[ng-class=\'noButtonClass\']'
};

exports.Time = {
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
};

exports.Tree = {
  ROW: '.slick-row',
  ROW_NODE_TOGGLE: '.js-node-toggle',
  ROW_NODE_EXPANDED_CLASS: 'fa-caret-down',
  ROW_NODE_COLLAPSED_CLASS: 'fa-caret-right',
  ROW_CHECKBOX: '.c-tristate',
  ROW_CHECKED_CLASS: 'c-tristate-on',
  ROW_UNCHECKED_CLASS: 'c-tristate-off',
  FILTER_BUTTON: '[title=\'Manage filters\']',
  ROW_1: '.slick-row:eq(0)',
  ROW_2: '.slick-row:eq(1)',
  ROW_3: '.slick-row:eq(2)',
  ROW_4: '.slick-row:eq(3)',
  ROW_5: '.slick-row:eq(4)',
  ROW_6: '.slick-row:eq(5)',
  ROW_7: '.slick-row:eq(6)',
  ROW_8: '.slick-row:eq(7)',
  ROW_9: '.slick-row:eq(8)',
  ROW_10: '.slick-row:eq(9)'
};
