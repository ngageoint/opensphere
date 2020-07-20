goog.provide('os.ui.alert.alertLinkFilter');

goog.require('os.ui.Module');


/**
 * Replace [Some Label|eventType] with a link that dispatches that event. Used in the Alert window
 * and alert popups.
 *
 * @param {!angular.$sce} $sce The sce service
 * @return {!angular.Filter} The filter function
 * @ngInject
 */
os.ui.alert.alertLinkFilter = function($sce) {
  return function(text) {
    if (typeof text == 'string') {
      text = os.ui.sanitize(text);
      text = text.replace(/\[([^|]+)\|([^\]]+)\]/g,
          '<button onclick="$(this).scope().$emit(\'dispatch\',\'$2\')" class="btn btn-link" type="button">$1</button>'
      );
      return $sce.trustAsHtml(text);
    }

    // the value is already a wrapped SCE item, so just return it
    return text;
  };
};

os.ui.Module.filter('alertlink', ['$sce', os.ui.alert.alertLinkFilter]);
