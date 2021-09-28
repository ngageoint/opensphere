goog.declareModuleId('plugin.im.action.feature.ui.FeatureActionsUI');

import {ROOT} from '../../../os/os.js';
import FilterActionsCtrl from '../../../os/ui/im/action/filteractionsui.js';
import Module from '../../../os/ui/module.js';
import TreeSearch from '../../../os/ui/slick/treesearch.js';
import {apply} from '../../../os/ui/ui.js';
import {editEntry, getColumns, getExportName} from '../featureaction.js';
import FeatureActionManager from '../featureactionmanager.js';
import * as node from '../featureactionnodemenu.js';

const DataManager = goog.require('os.data.DataManager');
const DataEventType = goog.require('os.data.event.DataEventType');

const Feature = goog.requireType('ol.Feature');
const DataEvent = goog.requireType('os.data.event.DataEvent');
const {default: Menu} = goog.requireType('os.ui.menu.Menu');
const layerMenu = goog.requireType('os.ui.menu.layer');


/**
 * The featureactions directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/im/action/importactions.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'featureactions';


/**
 * Add the directive to the module.
 */
Module.directive('featureactions', [directive]);



/**
 * Controller function for the featureactions directive.
 *
 * @extends {FilterActionsCtrl<Feature>}
 * @unrestricted
 */
export class Controller extends FilterActionsCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    /**
     * The context menu for feature action nodes.
     * @type {Menu<layerMenu.Context>|undefined}
     */
    this['contextMenu'] = node.getMenu();

    /**
     * Flag for whether to show default feature actions.
     * @type {boolean}
     */
    this['showDefaultActions'] = true;

    /**
     * Flag for whether to show default feature actions.
     * @type {boolean|undefined}
     */
    this['hasDefaultActions'] = undefined;

    DataManager.getInstance().listen(DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    DataManager.getInstance().unlisten(DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);
  }

  /**
   * Close the feature action window if the source was removed
   *
   * @param {DataEvent} event
   * @private
   */
  onSourceRemoved_(event) {
    if (event && event.source) {
      if (this.entryType && this.entryType == event.source.getId()) {
        this.close();
      }
    }
  }

  /**
   * @inheritDoc
   * @export
   */
  apply() {
    super.apply();

    if (this.entryType) {
      var dm = DataManager.getInstance();
      var source = dm.getSource(this.entryType);
      if (source) {
        var manager = FeatureActionManager.getInstance();
        manager.processItems(source.getId(), source.getFeatures(), true);
      }
    }
  }

  /**
   * @inheritDoc
   */
  getColumns() {
    return getColumns(this.entryType);
  }

  /**
   * @inheritDoc
   */
  getExportName() {
    return getExportName(this.entryType);
  }

  /**
   * @inheritDoc
   * @export
   */
  editEntry(opt_entry) {
    if (this.entryType) {
      editEntry(this.entryType, opt_entry);
    }
  }

  /**
   * @inheritDoc
   */
  onSearch() {
    super.onSearch();

    if (this['hasDefaultActions'] === undefined && this.scope['entries'] && this.scope['entries'].length > 0) {
      this['hasDefaultActions'] = this.scope['entries'].some((node) => {
        return node.getId() != TreeSearch.NO_RESULT_ID && node.getEntry().isDefault();
      });
      apply(this.scope);
    }
  }

  /**
   * Toggles showing default feature actions.
   * @export
   */
  toggleDefaultActions() {
    this.treeSearch.setShowDefaultActions(this['showDefaultActions']);
    this.onSearch();
  }
}
