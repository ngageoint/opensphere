goog.declareModuleId('plugin.track.ConfirmTrackUI');

import {ROOT} from '../../os/os.js';
import Module from '../../os/ui/module.js';
import WindowEventType from '../../os/ui/windoweventtype.js';
import KMLField from '../file/kml/kmlfield.js';
import PlacesManager from '../places/placesmanager.js';

/**
 * Dialog that prompts the user to pick a track.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
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
export class Controller {
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
