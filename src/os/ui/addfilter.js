goog.declareModuleId('os.ui.AddFilterUI');

import LayerEventType from '../events/layereventtype.js';
import {getMapContainer} from '../map/mapinstance.js';
import Module from './module.js';
import {Controller as AddFilterController, directive as addFilterDirective} from './query/addfilter.js';


/**
 * The combinator window directive
 *
 * @return {angular.Directive}
 */
export const directive = () => {
  var dir = addFilterDirective();
  dir.controller = Controller;
  return dir;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'osaddfilter';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for combinator window
 * @unrestricted
 */
export class Controller extends AddFilterController {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    const mapContainer = getMapContainer();
    mapContainer.listen(LayerEventType.ADD, this.updateLayers, false, this);
    mapContainer.listen(LayerEventType.REMOVE, this.updateLayers, false, this);
    mapContainer.listen(LayerEventType.RENAME, this.updateLayers, false, this);
  }

  /**
   * @inheritDoc
   */
  onDestroy() {
    super.onDestroy();

    const mapContainer = getMapContainer();
    mapContainer.unlisten(LayerEventType.ADD, this.updateLayers, false, this);
    mapContainer.unlisten(LayerEventType.REMOVE, this.updateLayers, false, this);
    mapContainer.unlisten(LayerEventType.RENAME, this.updateLayers, false, this);
  }
}
