goog.module('os.webgl.launchLayerComparePerformanceDialog');

const Promise = goog.require('goog.Promise');
const {launchConfirm} = goog.require('os.ui.window.ConfirmUI');


/**
 * Launch a dialog warning users of the risks in using 2D with lots of data.
 *
 * @return {!Promise}
 */
const launch2DPerformanceDialog = function() {
  return new Promise(function(resolve, reject) {
    var text = '<p>Using Layer Compare with the current data volume may degrade performance considerably or crash ' +
        'the browser. Click OK to use Layer Compare, or Cancel to abort.</p>' +
        '<p>If you would like to use Layer Compare safely, please consider narrowing your time range, applying ' +
        'filters, shrinking your query areas, or removing some feature layers.</p>';

    launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      confirm: resolve,
      cancel: reject,
      prompt: text,
      windowOptions: {
        'label': 'Feature Limit Exceeded',
        'icon': 'fa fa-warning',
        'x': 'center',
        'y': 'center',
        'width': '425',
        'height': 'auto',
        'modal': 'true',
        'headerClass': 'bg-warning u-bg-warning-text'
      }
    }));
  });
};

exports = launch2DPerformanceDialog;
