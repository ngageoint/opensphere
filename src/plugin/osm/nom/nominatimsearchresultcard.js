goog.declareModuleId('plugin.osm.nom.ResultCardUI');

import {ROOT} from '../../../os/os.js';
import Module from '../../../os/ui/module.js';
import FeatureResultCardCtrl from '../../../os/ui/search/featureresultcard.js';
import * as nom from './nominatim.js';

const googString = goog.require('goog.string');


/**
 * Result card UI for Nominatim search results.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/plugin/osm/nom/nominatimresultcard.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'nominatimresultcard';


/**
 * Register the nominatimresultcard directive.
 */
Module.directive('nominatimresultcard', [directive]);


/**
 * Controller for the nominatimresultcard directive.
 * @unrestricted
 */
export class Controller extends FeatureResultCardCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    /**
     * Details to display in the result card.
     * @type {string}
     */
    this['details'] = '';

    var details = [];

    var category = this.getField(nom.ResultField.CATEGORY);
    var type = this.getField(nom.ResultField.TYPE);
    if (category && type) {
      category = googString.toTitleCase(category);
      type = googString.toTitleCase(type);

      details.push(category + ' (' + type + ')');
    }

    var extraTags = /** @type {Object|undefined} */ (this.feature.get(nom.ResultField.EXTRA_TAGS));
    if (extraTags) {
      var place = /** @type {string|undefined} */ (extraTags[nom.ExtraDataField.PLACE]);
      if (place) {
        details.push(googString.toTitleCase(place));
      }

      var population = /** @type {string|undefined} */ (extraTags[nom.ExtraDataField.POPULATION]);
      if (population) {
        var popNum = Number(population);
        if (!isNaN(popNum)) {
          details.push('Population: ' + popNum.toLocaleString());
        } else {
          details.push('Population: ' + population);
        }
      }
    }

    this['details'] = details.join(' - ');
  }

  /**
   * Get the title to display on the card.
   *
   * @return {string} The title.
   * @export
   */
  getTitle() {
    return /** @type {string} */ (this.feature.get(nom.ResultField.DISPLAY_NAME)) || 'Unknown Result';
  }
}
