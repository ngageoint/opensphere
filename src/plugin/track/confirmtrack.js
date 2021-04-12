goog.module('plugin.track.ConfirmTrackUI');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const osTrack = goog.require('os.track');
const Module = goog.require('os.ui.Module');
const osWindow = goog.require('os.ui.window');
const PlacesManager = goog.require('plugin.places.PlacesManager');


/**
 * Dialog that prompts the user to pick a track.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  templateUrl: os.ROOT + 'views/plugin/track/confirmtrack.html',
  controller: Controller,
  controllerAs: 'confirm'
});


/**
 * Add the directive to the coreui module
 */
Module.directive('confirmtrack', [directive]);



/**
 * Controller for the track selection window.
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    var trackNode = PlacesManager.getInstance().getPlacesRoot();

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
  }

  /**
   * Get the name of a track.
   *
   * @param {!ol.Feature} track The track
   * @return {string} The name
   * @export
   */
  getTrackName(track) {
    var trackName = /** @type {string|undefined} */ (track.get(plugin.file.kml.KMLField.NAME));
    if (!trackName) {
      return 'Unnamed Track (id =' + track.getId() + ')';
    }

    return trackName;
  }
}

/**
 * Prompt the user to choose a track.
 *
 * @return {!Promise}
 */
plugin.track.promptForTrack = function() {
  return new Promise(function(resolve, reject) {
    plugin.track.launchConfirmTrack(resolve, reject);
  });
};


/**
 * Launch a dialog prompting the user to pick a color.
 *
 * @param {function(!ol.Feature)} confirm The confirm callback
 * @param {function(*)} cancel The cancel callback
 */
plugin.track.launchConfirmTrack = function(confirm, cancel) {
  var scopeOptions = {
    'confirmCallback': confirm,
    'cancelCallback': cancel,
    'yesText': 'OK',
    'yesIcon': 'fa fa-check',
    'yesButtonClass': 'btn-primary',
    'noText': 'Cancel',
    'noIcon': 'fa fa-ban',
    'noButtonClass': 'btn-secondary'
  };

  var windowOptions = {
    'label': 'Choose a Track',
    'icon': 'fa ' + osTrack.ICON,
    'x': 'center',
    'y': 'center',
    'width': 300,
    'min-width': 200,
    'max-width': 1200,
    'height': 'auto',
    'modal': 'true',
    'show-close': 'false'
  };

  var template = '<confirm><confirmtrack></confirmtrack></confirm>';
  osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};

exports = {
  Controller,
  directive
};
