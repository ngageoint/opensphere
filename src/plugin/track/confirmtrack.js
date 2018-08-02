goog.provide('plugin.track.ConfirmTrackCtrl');
goog.provide('plugin.track.confirmTrackDirective');

goog.require('goog.Promise');
goog.require('os.ui.Module');
goog.require('os.ui.window');


/**
 * Dialog that prompts the user to pick a track.
 * @return {angular.Directive}
 */
plugin.track.confirmTrackDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/plugin/track/confirmtrack.html',
    controller: plugin.track.ConfirmTrackCtrl,
    controllerAs: 'confirm'
  };
};


/**
 * Add the directive to the coreui module
 */
os.ui.Module.directive('confirmtrack', [plugin.track.confirmTrackDirective]);



/**
 * Controller for the color confirmation window.
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
plugin.track.ConfirmTrackCtrl = function($scope) {
  var trackNode = plugin.track.getTrackNode();

  /**
   * The available tracks.
   * @type {!Array<!ol.Feature>}
   */
  this['tracks'] = trackNode ? trackNode.getFeatures() : [];

  /**
   * The selected track.
   * @type {ol.Feature|undefined}
   */
  this['track'] = this['tracks'][0] || undefined;

  $scope.$watch('confirm.track', function(newVal, oldVal) {
    $scope.$parent['confirmValue'] = newVal;
  });

  $scope.$emit(os.ui.WindowEventType.READY);
};


/**
 * Get the name of a track.
 * @param {!ol.Feature} track The track
 * @return {string} The name
 */
plugin.track.ConfirmTrackCtrl.prototype.getTrackName = function(track) {
  var trackName = /** @type {string|undefined} */ (track.get(plugin.file.kml.KMLField.NAME));
  if (!trackName) {
    return 'Unnamed Track (id =' + track.getId() + ')';
  }

  return trackName;
};
goog.exportProperty(
    plugin.track.ConfirmTrackCtrl.prototype,
    'getTrackName',
    plugin.track.ConfirmTrackCtrl.prototype.getTrackName);


/**
 * Prompt the user to choose a track.
 * @return {!goog.Promise}
 */
plugin.track.promptForTrack = function() {
  return new goog.Promise(function(resolve, reject) {
    plugin.track.launchConfirmTrack(resolve, reject);
  });
};


/**
 * Launch a dialog prompting the user to pick a color.
 * @param {function(!ol.Feature)} confirm The confirm callback
 * @param {function(*)} cancel The cancel callback
 */
plugin.track.launchConfirmTrack = function(confirm, cancel) {
  var scopeOptions = {
    'confirmCallback': confirm,
    'cancelCallback': cancel,
    'yesText': 'OK',
    'yesIcon': 'fa fa-check lt-blue-icon',
    'noText': 'Cancel',
    'noIcon': 'fa fa-ban red-icon'
  };

  var windowOptions = {
    'label': 'Choose a Track',
    'icon': 'fa ' + plugin.track.ICON,
    'x': 'center',
    'y': 'center',
    'width': 300,
    'min-width': 200,
    'max-width': 1200,
    'height': 'auto',
    'modal': 'true',
    'show-close': 'false',
    'no-scroll': 'true'
  };

  var template = '<confirm><confirmtrack></confirmtrack></confirm>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
