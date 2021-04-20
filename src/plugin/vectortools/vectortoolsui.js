goog.declareModuleId('plugin.vectortools.ui');

const osWindow = goog.require('os.ui.window');
const {directiveTag: joinEl} = goog.require('plugin.vectortools.JoinUI');
const {directiveTag: mergeEl} = goog.require('plugin.vectortools.MergeUI');
const Icons = goog.require('plugin.vectortools.Icons');

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
