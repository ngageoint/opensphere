goog.provide('plugin.osm.nom.ResultCardCtrl');
goog.provide('plugin.osm.nom.resultCardDirective');

goog.require('os.ui.Module');
goog.require('os.ui.search.FeatureResultCardCtrl');


/**
 * Result card UI for Nominatim search results.
 * @return {angular.Directive}
 */
plugin.osm.nom.resultCardDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/plugin/osm/nom/nominatimresultcard.html',
    controller: plugin.osm.nom.ResultCardCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Register the nominatimresultcard directive.
 */
os.ui.Module.directive('nominatimresultcard', [plugin.osm.nom.resultCardDirective]);


/**
 * Controller for the nominatimresultcard directive.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @constructor
 * @extends {os.ui.search.FeatureResultCardCtrl}
 * @ngInject
 */
plugin.osm.nom.ResultCardCtrl = function($scope, $element) {
  plugin.osm.nom.ResultCardCtrl.base(this, 'constructor', $scope, $element);

  /**
   * Details to display in the result card.
   * @type {string}
   */
  this['details'] = '';

  var details = [];

  var category = this.getField(plugin.osm.nom.ResultField.CATEGORY);
  var type = this.getField(plugin.osm.nom.ResultField.TYPE);
  if (category && type) {
    category = goog.string.toTitleCase(category);
    type = goog.string.toTitleCase(type);

    details.push(category + ' (' + type + ')');
  }

  var extraTags = /** @type {Object|undefined} */ (this.feature.get(plugin.osm.nom.ResultField.EXTRA_TAGS));
  if (extraTags) {
    var place = /** @type {string|undefined} */ (extraTags[plugin.osm.nom.ExtraDataField.PLACE]);
    if (place) {
      details.push(goog.string.toTitleCase(place));
    }

    var population = /** @type {string|undefined} */ (extraTags[plugin.osm.nom.ExtraDataField.POPULATION]);
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
};
goog.inherits(plugin.osm.nom.ResultCardCtrl, os.ui.search.FeatureResultCardCtrl);


/**
 * Get the title to display on the card.
 * @return {string} The title.
 */
plugin.osm.nom.ResultCardCtrl.prototype.getTitle = function() {
  return /** @type {string} */ (this.feature.get(plugin.osm.nom.ResultField.DISPLAY_NAME) || 'Unknown Result');
};
goog.exportProperty(
    plugin.osm.nom.ResultCardCtrl.prototype,
    'getTitle',
    plugin.osm.nom.ResultCardCtrl.prototype.getTitle);
