goog.module('os.ui.alert.alertLinkFilter');
goog.module.declareLegacyNamespace();

const ui = goog.require('os.ui');
const Module = goog.require('os.ui.Module');


/**
 * Replace [Some Label|eventType] with a link that dispatches that event. Used in the Alert window
 * and alert popups.
 *
 * @param {!angular.$sce} $sce The sce service
 * @return {!angular.Filter} The filter function
 * @ngInject
 */
const alertLinkFilter = function($sce) {
  return function(text) {
    if (typeof text == 'string') {
      text = /** @type {angular.$sanitize} */ (ui.injector.get('$sanitize'))(text);
      text = text.replace(/\[([^|]+)\|([^\]]+)\]/g,
          '<button onclick="$(this).scope().$emit(\'dispatch\',\'$2\')" class="btn btn-link border-0 p-0" ' +
          'type="button">$1</button>'
      );
      return $sce.trustAsHtml(text);
    }

    // the value is already a wrapped SCE item, so just return it
    return text;
  };
};

Module.filter('alertlink', ['$sce', alertLinkFilter]);

exports = alertLinkFilter;
