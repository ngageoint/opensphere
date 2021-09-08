goog.module('os.ui.column');
goog.module.declareLegacyNamespace();

const {create} = goog.require('os.ui.window');
const ColumnDefinition = goog.requireType('os.data.ColumnDefinition');
const {directiveTag: columnManagerUi} = goog.require('os.ui.column.ColumnManagerUI');

/**
 * @typedef {function(Array<ColumnDefinition>, Function)}
 */
let LaunchColumnManagerFn;

/**
 * Launches a column manager window with the given columns
 *
 * @param {Array<ColumnDefinition>} columns
 * @param {Function} callback
 */
let launchColumnManagerFn = function(columns, callback) {
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

  var template = `<${columnManagerUi} columns="columns" accept-callback="acceptCallback" ></${columnManagerUi}>`;
  create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};

/**
 * Launches a column manager window with the given columns
 *
 * @param {Array<ColumnDefinition>} columns
 * @param {Function} callback
 */
const launchColumnManager = function(columns, callback) {
  launchColumnManagerFn(columns, callback);
};

/**
 * Set the launchColumnManager function.
 * @param {LaunchColumnManagerFn} fn The function.
 */
const setLaunchColumnManagerFn = (fn) => {
  launchColumnManagerFn = fn;
};

/**
 * Launches a column manager window with the given columns
 *
 * @param {Array<ColumnDefinition>} columns
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

  var template = `<${columnManagerUi} columns="columns" shown-callback="shownCallback"></${columnManagerUi}>`;
  create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};

exports = {
  LaunchColumnManagerFn,
  launchColumnManager,
  launchColumnManagerWithShownCallback,
  setLaunchColumnManagerFn
};
