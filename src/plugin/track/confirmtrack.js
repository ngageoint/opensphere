goog.module('plugin.track.ConfirmTrackUI');

const {ROOT} = goog.require('os');
const {default: KMLField} = goog.require('plugin.file.kml.KMLField');
const Module = goog.require('os.ui.Module');
const {default: PlacesManager} = goog.require('plugin.places.PlacesManager');
const WindowEventType = goog.require('os.ui.WindowEventType');

const OlFeature = goog.requireType('ol.Feature');


/**
 * Dialog that prompts the user to pick a track.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  templateUrl: ROOT + 'views/plugin/track/confirmtrack.html',
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
     * @type {!Array<!OlFeature>}
     */
    this['tracks'] = trackNode ? trackNode.getFeatures() : [];

    /**
     * The selected track.
     * @type {OlFeature|undefined}
     */
    this['track'] = this['tracks'][0] || undefined;

    $scope.$watch('confirm.track', function(newVal, oldVal) {
      $scope.$parent['confirmValue'] = newVal;
    });

    $scope.$emit(WindowEventType.READY);
  }

  /**
   * Get the name of a track.
   *
   * @param {!OlFeature} track The track
   * @return {string} The name
   * @export
   */
  getTrackName(track) {
    var trackName = /** @type {string|undefined} */ (track.get(KMLField.NAME));
    if (!trackName) {
      return 'Unnamed Track (id =' + track.getId() + ')';
    }

    return trackName;
  }
}

exports = {
  Controller,
  directive
};
