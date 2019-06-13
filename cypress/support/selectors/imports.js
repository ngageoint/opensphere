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

exports.SHPImportDialog = {
  DIALOG: '[label=\'SHP Import\']',
  DIALOG_HEADER: '[title=\'SHP Import\']',
  DIALOG_CLOSE: '[label=\'SHP Import\'] .close',
  PREV_BUTTON: '[title=\'Previous step\']',
  NEXT_BUTTON: '[title=\'Next step\']',
  DONE_BUTTON: '[ng-click=\'wiz.accept()\']',
  CANCEL_BUTTON: '[ng-click=\'wiz.cancel()\']'
};
