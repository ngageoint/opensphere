goog.declareModuleId('plugin.im.action.feature.ui.launchForLayer');

import {ICON} from '../../../os/im/action/importaction.js';
import * as osLayer from '../../../os/layer/layer.js';
import {sanitizeId} from '../../../os/ui/ui.js';
import * as osWindow from '../../../os/ui/window.js';
import {HELP_TEXT, TITLE} from '../featureaction.js';
import {directiveTag as featureActionsUi} from './featureactionsui.js';


/**
 * Launch the feature action window for a layer.
 *
 * @param {string} layerId The layer id.
 */
const launchForLayer = function(layerId) {
  // pluralize for the window label
  var label = TITLE;

  var windowId = sanitizeId('featureActions-' + layerId);

  if (!osWindow.exists(windowId)) {
    var title = osLayer.getTitle(layerId, true);
    if (title) {
      label += ' for ' + title;
    }

    var windowOptions = {
      'id': windowId,
      'label': label,
      'key': windowId,
      'icon': 'fa ' + ICON,
      'x': 'center',
      'y': 'center',
      'width': 500,
      'height': 500,
      'show-close': true,
      'min-width': 300,
      'max-width': 2000,
      'min-height': 400,
      'max-height': 2000
    };

    var scope = {
      'type': layerId,
      'helpTitle': TITLE,
      'helpText': HELP_TEXT
    };

    var template = `<${featureActionsUi}></${featureActionsUi}>`;
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scope);
  } else {
    osWindow.bringToFront(windowId);
  }
};

export default launchForLayer;
