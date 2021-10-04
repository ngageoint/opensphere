goog.declareModuleId('os.ui.column');

import {create} from '../window.js';
import {directiveTag as columnManagerUi} from './columnmanager.js';
const {default: ColumnDefinition} = goog.requireType('os.data.ColumnDefinition');


/**
 * @typedef {function(Array<ColumnDefinition>, Function)}
 */
export let LaunchColumnManagerFn;

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
export const launchColumnManager = function(columns, callback) {
  launchColumnManagerFn(columns, callback);
};

/**
 * Set the launchColumnManager function.
 * @param {LaunchColumnManagerFn} fn The function.
 */
export const setLaunchColumnManagerFn = (fn) => {
  launchColumnManagerFn = fn;
};

/**
 * Launches a column manager window with the given columns
 *
 * @param {Array<ColumnDefinition>} columns
 * @param {string} header Dialog header
 * @param {Function} callback
 */
export const launchColumnManagerWithShownCallback = function(columns, header, callback) {
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
