goog.declareModuleId('plugin.vectortools.ui');

import Icons from './icons.js';
import {directiveTag as joinEl} from './joinwindow.js';
import {directiveTag as mergeEl} from './mergewindow.js';

const osWindow = goog.require('os.ui.window');

/**
 * Launches the Join Layer window.
 *
 * @param {Array<string>} sourceIds The source/layer IDs to join
 */
export const launchJoinWindow = function(sourceIds) {
  const title = 'Join ' + sourceIds.length + ' Layers';
  osWindow.create({
    'label': title,
    'icon': 'fa ' + Icons.JOIN_ICON,
    'x': 'center',
    'y': 'center',
    'width': '500',
    'height': 'auto',
    'show-close': true
  }, `<${joinEl}></${joinEl}>`, undefined, undefined, undefined, {
    'sourceIds': sourceIds
  });
};

/**
 * Launches the Merge Layer window.
 *
 * @param {Array<string>} sourceIds The source/layer IDs to merge
 */
export const launchMergeWindow = function(sourceIds) {
  const title = 'Merge ' + sourceIds.length + ' Layers';
  osWindow.create({
    'label': title,
    'icon': 'fa ' + Icons.MERGE_ICON,
    'x': 'center',
    'y': 'center',
    'width': '400',
    'height': 'auto',
    'show-close': true
  }, `<${mergeEl}></${mergeEl}>`, undefined, undefined, undefined, {
    'sourceIds': sourceIds
  });
};
