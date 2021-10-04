goog.declareModuleId('os.ui.columnactions.launchColumnActionPrompt');

import {create} from '../window.js';

const {buildString} = goog.require('goog.string');

const {default: AbstractColumnAction} = goog.requireType('os.ui.columnactions.AbstractColumnAction');
const {default: IColumnActionModel} = goog.requireType('os.ui.columnactions.IColumnActionModel');


/**
 * Launch a dialog prompting the user the file they're importing already exists and requesting action.
 *
 * @param {Array<AbstractColumnAction>} matched
 * @param {*} value from the column
 * @param {IColumnActionModel} colDef
 */
const launchColumnActionPrompt = function(matched, value, colDef) {
  var scopeOptions = {
    'matched': matched,
    'colDef': colDef,
    'value': value,
    'doneText': 'Close',
    'doneIcon': 'fa fa-check'
  };

  var windowOptions = {
    'label': buildString('Select a Column Action for ', colDef.getTitle(), ' = ', value),
    'icon': 'fa fa-action',
    'x': 'center',
    'y': 'center',
    'width': '450',
    'height': '350',
    'modal': 'true',
    'show-close': 'true'
  };

  var template = '<columnactions class="d-flex flex-fill"></columnactions>';
  create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};

export default launchColumnActionPrompt;
