goog.declareModuleId('plugin.places.ui.SavePlacesUI');

import '../../../os/ui/im/basicinfo.js';
import AlertEventSeverity from '../../../os/alert/alerteventseverity.js';
import AlertManager from '../../../os/alert/alertmanager.js';
import {ROOT} from '../../../os/os.js';
import {Controller as ExportOptionsCtrl} from '../../../os/ui/ex/exportoptions.js';
import ExportOptionsEvent from '../../../os/ui/ex/exportoptionsevent.js';
import Module from '../../../os/ui/module.js';
import * as column from '../../../os/ui/slick/column.js';
import * as osWindow from '../../../os/ui/window.js';
import WindowEventType from '../../../os/ui/windoweventtype.js';
import * as places from '../places.js';


/**
 * Save places directive.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'initSources': '&'
  },
  templateUrl: ROOT + 'views/plugin/places/saveplaces.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'saveplaces';


/**
 * Add the directive to the module
 */
Module.directive('saveplaces', [directive]);


/**
 * Controller for the save places dialog.
 * @unrestricted
 */
export class Controller extends ExportOptionsCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope);

    /**
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * @type {!Object}
     */
    this['config'] = {
      'title': '',
      'description': '',
      'tags': '',
      'features': []
    };

    /**
     * @type {!Array<!ColumnDefinition>}
     */
    this['columns'] = [];

    /**
     * @type {string}
     */
    this['titleSample'] = '';

    /**
     * @type {string}
     */
    this['descSample'] = '';

    /**
     * @type {!Object<string, string>}
     */
    this['help'] = {
      'title': 'Custom title given to all saved places.',
      'titleColumn': 'Column used to apply titles to all saved places. If a selected item doesn\'t have this field ' +
          'defined, a generic title will be given. You may also choose to apply a custom title to new places.',
      'description': 'Description applied to all saved places.',
      'descColumn': 'Column used to apply descriptions to all saved places. If a selected item doesn\'t have this ' +
          'field defined, the description will be left blank. You may also choose to apply a custom description to ' +
          'new places.',
      'tags': 'Comma-delimited list of tags to apply to all saved places. Tags can be used to group or search ' +
          'places in the Layers tab of the Layers window.',
      'tagsColumn': 'Column used to apply tags to all saved places. Tags can be used to group or search places in ' +
          'the Layers tab of the Layers window.  If an item doesn\'t have this field defined, the tags will be left ' +
          'blank. You may also choose to provide your own custom tags.'
    };

    $scope.$on(ExportOptionsEvent.CHANGE, this.onOptionsChange_.bind(this));

    setTimeout(function() {
      $scope.$emit(WindowEventType.READY);
    }, 0);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.element = null;
  }

  /**
   * Close the window.
   *
   * @export
   */
  cancel() {
    osWindow.close(this.element);
  }

  /**
   * Save selection to places and close the window.
   *
   * @export
   */
  confirm() {
    places.saveFromSource(this['config']);

    // notify that places were saved to the layer so the user knows where to look
    var plural = this['count'] > 1 ? 's' : '';
    var msg = 'Added ' + this['count'] + ' feature' + plural + ' to the ' + places.TITLE + ' layer.';
    AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.SUCCESS);

    this.cancel();
  }

  /**
   * @inheritDoc
   */
  includeSource(source) {
    return source.getId() != places.ID;
  }

  /**
   * Handle changes to the selected sources.
   *
   * @param {angular.Scope.Event} event
   * @param {Array<!ol.Feature>} items
   * @param {Array<!VectorSource>} sources
   * @private
   */
  onOptionsChange_(event, items, sources) {
    event.stopPropagation();

    if (this['config']) {
      if (this['config']['features']) {
        this['config']['features'].length = 0;

        // update the export items
        if (items && items.length > 0) {
          this['config']['features'] = this['config']['features'].concat(items);
        }
      }

      // update the displayed columns
      this['columns'] = sources && sources.length > 0 ? sources[0].getColumns() : [];
      this['columns'].sort(column.nameCompare);
    }
  }
}
