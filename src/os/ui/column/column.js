goog.module('os.ui.column');
goog.module.declareLegacyNamespace();

goog.require('os.ui.column.columnManagerDirective');
const osWindow = goog.require('os.ui.window');
const ColumnDefinition = goog.requireType('os.data.ColumnDefinition');


/**
 * Launches a column manager window with the given columns
 *
 * @param {Array.<ColumnDefinition>} columns
 * @param {Function} callback
 */
const launchColumnManager = function(columns, callback) {
  var scopeOptions = {
    'columns': columns,
    'acceptCallback': callback
  };

  var windowOptions = {
    'label': 'Column Manager',
    'icon': 'fa fa-columns',
    'x': 'center',
    'y': 'center',
    'width': '600',
    'min-width': '500',
    'max-width': '700',
    'height': '400',
    'min-height': '350',
    'max-height': '1000',
    'show-close': true,
    'modal': true
  };

  var template = '<column-manager columns="columns" accept-callback="acceptCallback" ></column-manager>';
  osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};


/**
 * Launches a column manager window with the given columns
 *
 * @param {Array.<ColumnDefinition>} columns
 * @param {string} header Dialog header
 * @param {Function} callback
 */
const launchColumnManagerWithShownCallback = function(columns, header, callback) {
  var scopeOptions = {
    'columns': columns,
    'shownCallback': callback
  };

  var windowOptions = {
    'label': header,
    'icon': 'fa fa-columns',
    'x': 'center',
    'y': 'center',
    'width': '600',
    'min-width': '500',
    'max-width': '700',
    'height': '400',
    'min-height': '350',
    'max-height': '1000',
    'show-close': true,
    'modal': true
  };

  var template = '<column-manager columns="columns" shown-callback="shownCallback"></column-manager>';
  osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};


exports = {
  launchColumnManager,
  launchColumnManagerWithShownCallback
};
