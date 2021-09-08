goog.module('os.ui.SlickPropertiesAsyncRenderer');

const {forEach} = goog.require('goog.object');
const {inIframe} = goog.require('os');
const Fields = goog.require('os.Fields');
const {launchPropertyInfo} = goog.require('os.ui.PropertyInfoUI');


/**
 *
 * @param {!Object} elem
 * @param {number} row
 * @param {Object} dataContext
 * @param {Object} colDef
 */
const SlickPropertiesAsyncRenderer = function(elem, row, dataContext, colDef) {
  if (dataContext) {
    var id = /** @type {!string} */ (dataContext.get(Fields.ID).toString());
    var properties = /** @type {!Object} */ (dataContext.get(Fields.PROPERTIES));
    if (properties instanceof Object && typeof id === 'string') {
      var $elem = $(elem);
      var doc = elem.ownerDocument;
      var myWin = doc.defaultView || doc.parentWindow;
      forEach(properties, processProperty);
      $elem.on('click', function() {
        if (inIframe(myWin)) {
          launchPropertyInfo(id, properties);
        } else {
          myWin['os']['ui']['launchPropertyInfo'](id, properties);
        }
      });
    }
  }
};

/**
 * @param {*} value
 * @param {*} index
 * @param {Object} object
 */
const processProperty = function(value, index, object) {
  if (goog.isObject(value)) {
    delete object[index];
  }
};

exports = SlickPropertiesAsyncRenderer;
