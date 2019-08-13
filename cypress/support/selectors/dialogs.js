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
  DESCRIPTION_PANEL: '[bind-directive=\'addData.getInfo()\']',
  CLOSE_BUTTON: '[ng-click=\'addData.close()\']',
  Tree: {
    LAYER_TOGGLE_SWITCH: '.c-toggle-switch',
    LAYER_IS_ON_CLASS: 'c-toggle-switch-on',
    LAYER_IS_OFF_CLASS: 'c-toggle-switch-off',
    REMOVE_THE_FILE_BUTTON: '[title=\'Remove the file\']'
  }
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
  DIALOG_HEADER: '[title=\'Add Place\']'
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
    OPERATOR_DROPDOWN: '[title=\'Whether to pass all filters (AND) or any filter (OR)\']',
    QUERY_EXCLUDE_TOGGLE_BADGE: '[title=\'Toggles between querying and excluding the area\']',
    EDIT_LAYER_BUTTON: '[title=\'Edit\']',
    REMOVE_LAYER_BUTTON: '[title=\'Remove\']'
  },
  EXPORT_BUTTON: '[ng-click=\'comboCtrl.launchExport()\']',
  Import: {
    BUTTON: '[ng-click=\'comboCtrl.launchExport()\']',
    Menu: {
      BUTTON: '[ng-click=\'comboCtrl.openImportMenu()\']',
      IMPORT_FILE_URL: '[title=\'Import areas from a file or URL\']',
      ENTER_COORDINATES: '[title=\'Enter coordinates to load data for a box, circle, or polygon\']',
      WHOLE_WORLD: '[title=\'Load data for the whole world\']'
    }
  },
  APPLY_BUTTON: '[ng-click=\'comboCtrl.apply()\']',
  CLOSE_BUTTON: '[ng-click=\'comboCtrl.close()\']'
};

exports.alertsDialog = {
  DIALOG: '#alerts',
  DIALOG_HEADER: '[title=\'Alerts\']',
  DIALOG_CLOSE: '#alerts .close',
  ALERT: '.alert',
  SHOW_POPUPS_CHECKBOX: '#alerts__show-popups',
  CLEAR_ALERTS_BUTTON: '[title=\'Clear all alerts\']'
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
  SOURCE_CHECKBOX: '[name=\'sourcelist\'] [name=\'items\']',
  OK_BUTTON: '[ng-click=\'buffer.confirm()\']',
  CANCEL_BUTTON: '[ng-click=\'buffer.cancel()\']'
};

exports.createColumnAssociationDialog = {
  DIALOG_HEADER: '[title=\'Create Column Association\']'
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
    COLUMN_DROPDOWN: '[ng-model=\'expr.column\']',
    OPERATOR_DROPDOWN: '[ng-model=\'expr.op\']',
    VALUE_DROPDOWN: '[name=\'literal\']',
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
    GROUPING_NODE: '.c-node-toggle',
    GROUPING_OPERATOR_DROPDOWN: '[ng-model=\'item.grouping\']',
    GROUPING_REMOVE_BUTTON: '[ng-click=\'groupUi.remove()\'] [title=\'Remove the expression\']',
    GROUPING_1_NODE: '.c-node-toggle:eq(0)',
    GROUPING_1_OPERATOR_DROPDOWN: '[ng-model=\'item.grouping\']:eq(0)',
    GROUPING_1_REMOVE_BUTTON: '[ng-click=\'groupUi.remove()\'] [title=\'Remove the expression\']:eq(0)',
    GROUPING_2_NODE: '.c-node-toggle:eq(1)',
    GROUPING_2_OPERATOR_DROPDOWN: '[ng-model=\'item.grouping\']:eq(1)',
    GROUPING_2_REMOVE_BUTTON: '[ng-click=\'groupUi.remove()\'] [title=\'Remove the expression\']:eq(1)',
    EXPRESSION_TEXT: '#editfeatureaction .grid-canvas .text-truncate',
    EXPRESSION_EDIT_BUTTON: '[title=\'Edit the expression\']',
    EXPRESSION_REMOVE_BUTTON: '[title=\'Remove the expression\']',
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

exports.descriptionInfoDialog = {
  DIALOG: '[id*=descriptionInfo]',
  CONTENT: '[id*=descriptionInfo] iframe',
  CLOSE_BUTTON: '[id*=descriptionInfo] [ng-click=\'windowCtrl.close(true)\']'
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
  DIALOG_HEADER: '[title=\'Edit Column Association\']'
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
  DIALOG_HEADER: '[title=\'Edit Place\']'
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
  SOURCE_CHECKBOX: '#export [name=\'items\']',
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
    TOGGLE_CHECKBOX: '[title=\'If the action should automatically execute against loaded data\']',
    TEXT: '[label=\'Feature Actions for load-data-file-test-features.zip Features\'] .text-truncate span',
    COPY_BUTTON: '[title=\'Copy the action\']',
    EDIT_BUTTON: '[title=\'Edit the action\']',
    REMOVE_BUTTON: '[title=\'Remove the action\']',
    FEATURE_1_TOGGLE_CHECKBOX: '[title=\'If the action should automatically execute against ' +
    'loaded data\']:eq(0)',
    FEATURE_1_TEXT: '[label=\'Feature Actions for load-data-file-test-features.zip Features\'] ' +
    '.text-truncate span:eq(0)',
    FEATURE_1_COPY_BUTTON: '[title=\'Copy the action\']:eq(0)',
    FEATURE_1_EDIT_BUTTON: '[title=\'Edit the action\']:eq(0)',
    FEATURE_1_REMOVE_BUTTON: '[title=\'Remove the action\']:eq(0)',
    FEATURE_2_TOGGLE_CHECKBOX: '[title=\'If the action should automatically execute against ' +
    'loaded data\']:eq(1)',
    FEATURE_2_TEXT: '[label=\'Feature Actions for load-data-file-test-features.zip Features\'] ' +
    '.text-truncate span:eq(1)',
    FEATURE_2_COPY_BUTTON: '[title=\'Copy the action\']:eq(1)',
    FEATURE_2_EDIT_BUTTON: '[title=\'Edit the action\']:eq(1)',
    FEATURE_2_REMOVE_BUTTON: '[title=\'Remove the action\']:eq(1)',
    FEATURE_3_TOGGLE_CHECKBOX: '[title=\'If the action should automatically execute against ' +
    'loaded data\']:eq(2)',
    FEATURE_3_TEXT: '[label=\'Feature Actions for load-data-file-test-features.zip Features\'] ' +
    '.text-truncate span:eq(2)',
    FEATURE_3_COPY_BUTTON: '[title=\'Copy the action\']:eq(2)',
    FEATURE_3_EDIT_BUTTON: '[title=\'Edit the action\']:eq(2)',
    FEATURE_3_REMOVE_BUTTON: '[title=\'Remove the action\']:eq(2)'
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
    FEATURE_TEXT: '#featureInfo .slick-cell.r1',
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

exports.historyDialog = {
  DIALOG: '#history',
  DIALOG_HEADER: '[title=\'History\']',
  DIALOG_CLOSE: '#history .close',
  COMMAND: '[ng-repeat=\'command in historyView.commandHistory\']',
  CLEAR_HISTORY_BUTTON: '[title=\'Clear all history\']'
};

exports.layerDescriptionDialog = {
  DIALOG: '[label=\'Layer Description\']',
  DIALOG_HEADER: '[title=\'Layer Description\']',
  DIALOG_CLOSE: '[label=\'Layer Description\'] .close',
  DIALOG_TEXT: '[name=\'confirmForm\']',
  CLOSE_BUTTON: '[ng-class=\'yesButtonClass\']'
};

exports.featureListDialog = {
  DIALOG: '[id*=featureList]',
  DIALOG_HEADER: '[id*=\'featureList\'] .js-window__header',
  DIALOG_CLOSE: '[id*=\'featureList\'] .close',
  DIALOG_FOOTER: '[id*=\'featureList\'] .modal-footer',
  CLOSE_BUTTON: '[ng-click=\'ctrl.close()\']',
  contextMenu: {
    PANEL: '#menu',
    SELECT_ALL: '[title=\'Selects all items\']',
    DESELECT_ALL: '[title=\'Deselects all items\']',
    INVERT: '[title=\'Inverts the selection\']',
    SORT_SELECTED: '[title=\'Sorts by the selected items\']',
    HIDE_SELECTED: '[title=\'Hides selected items\']',
    HIDE_UNSELECTED: '[title=\'Hides unselected items\']',
    DISPLAY_ALL: '[title=\'Displays all items\']',
    REMOVE_SELECTED: '[title=\'Removes selected items\']',
    REMOVE_UNSELECTED: '[title=\'Removes the unselected items\']',
    EXPORT: '[title=\'Exports data to a file\']',
    GO_TO: '[title=\'Repositions the map to display features at this level of the tree\']'
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
  SOURCE_CHECKBOX: '#savePlaces .custom-checkbox',
  OK_BUTTON: '[ng-click=\'ctrl.confirm()\']',
  CANCEL_BUTTON: '[ng-click=\'ctrl.cancel()\']'
};

exports.setLabelDialog = {
  DIALOG: '#importActionConfig',
  DIALOG_HEADER: '[title=\'Set Label\']',
  SIZE_DROPDOWN: '#importActionConfig [max=\'labelCtrl.maxSize\']',
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
  OK_BUTTON: '[ng-class=\'yesIcon\']',
  CANCEL_BUTTON: '[ng-class=\'noButtonClass\']'
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
