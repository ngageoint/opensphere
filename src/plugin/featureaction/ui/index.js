goog.declareModuleId('plugin.im.action.feature.ui');

import {ICON} from '../../../os/im/action/importaction.js';
import ImportActionManager from '../../../os/im/action/importactionmanager.js';
import * as osWindow from '../../../os/ui/window.js';
import {directiveTag as editUi} from './editfeatureaction.js';

/**
 * Create/edit a feature action entry. If no entry is provided, a new one will be created.
 *
 * @param {string} type The entry type.
 * @param {Array} columns The filter columns.
 * @param {function(FilterActionEntry<T>)} callback The callback to fire when the entry is ready.
 * @param {FilterActionEntry<T>=} opt_entry The entry to edit.
 * @param {string=} opt_label Base window label.
 * @template T
 */
export const launchEditFeatureAction = function(type, columns, callback, opt_entry, opt_label) {
  var iam = ImportActionManager.getInstance();
  var label = opt_label || iam.entryTitle;
  var entry = opt_entry;
  if (!entry) {
    // create a new entry and default it to enabled
    entry = iam.createActionEntry();
    entry.setEnabled(true);
    entry.setType(type);

    label = 'Create ' + label;
  } else {
    // editing an existing entry
    label = 'Edit ' + label;
  }

  var options = {
    'id': 'editfeatureaction',
    'icon': 'fa ' + ICON,
    'label': label,
    'x': 'center',
    'y': 'center',
    'show-close': true,
    'min-width': 850,
    'min-height': 500,
    'max-width': 1500,
    'max-height': 1000,
    'modal': true,
    'width': 850,
    'height': 600
  };

  var scopeOptions = {
    'entry': entry,
    'type': type,
    'columns': columns,
    'callback': callback
  };

  osWindow.create(options, editUi, undefined, undefined, undefined, scopeOptions);
};
