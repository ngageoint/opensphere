goog.module('os.ui.SlickDescriptionAsyncRenderer');

const {inIframe} = goog.require('os');
const {sanitizeId} = goog.require('os.ui');
const {launchDescriptionInfo} = goog.require('os.ui.DescriptionInfoUI');


/**
 *
 * @param {!Object} elem
 * @param {number} row
 * @param {Object} dataContext
 * @param {Object} colDef
 */
const SlickDescriptionAsyncRenderer = function(elem, row, dataContext, colDef) {
  if (dataContext && colDef && colDef['field']) {
    var feature = /** @type {ol.Feature} */ (dataContext);

    // this is used for a DOM element id, so replace all non-word characters with underscores
    var id = sanitizeId(String(feature.getId()));
    var desc = /** @type {string} */ (feature.get(colDef['field']));
    if (id && desc) {
      var $elem = $(elem);
      var doc = elem.ownerDocument;
      var myWin = doc.defaultView || doc.parentWindow;
      $elem.on('click', function() {
        if (inIframe(myWin)) {
          launchDescriptionInfo(id, desc);
        } else {
          myWin['os']['ui']['launchDescriptionInfo'](id, desc);
        }
      });
    }
  }
};

exports = SlickDescriptionAsyncRenderer;
