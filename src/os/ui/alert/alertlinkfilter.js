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
    text = os.ui.sanitize(text);
    text = text.replace(/\[([^|]+)\|([^\]]+)\]/g, '<a onclick="$(this).scope().$emit(\'dispatch\',\'$2\')">$1</a>');
    return $sce.trustAsHtml(text);
  };
};

os.ui.Module.filter('alertlink', ['$sce', os.ui.alert.alertLinkFilter]);
