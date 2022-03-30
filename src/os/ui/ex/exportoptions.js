goog.declareModuleId('os.ui.ex.ExportOptionsUI');

import {listen, unlistenByKey} from 'ol/src/events.js';

import '../checklist.js';
import DataManager from '../../data/datamanager.js';
import DataEventType from '../../data/event/dataeventtype.js';
import SelectionType from '../../events/selectiontype.js';
import {ROOT} from '../../os.js';
import PropertyChange from '../../source/propertychange.js';
import StyleManager from '../../style/stylemanager_shim.js';
import StyleType from '../../style/styletype.js';
import ChecklistEvent from '../checklistevent.js';
import Module from '../module.js';
import {apply} from '../ui.js';
import ExportOptionsEvent from './exportoptionsevent.js';

const Disposable = goog.require('goog.Disposable');
const GoogEventType = goog.require('goog.events.EventType');
const {htmlEscape} = goog.require('goog.string');

const {default: DataEvent} = goog.requireType('os.data.event.DataEvent');
const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');
const {default: ISource} = goog.requireType('os.source.ISource');
const {default: VectorSource} = goog.requireType('os.source.Vector');


/**
 * The exportoptions directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  scope: {
    'allowMultiple': '=',
    'showLabels': '=',
    'initSources': '&',
    'showCount': '@'
  },
  templateUrl: ROOT + 'views/ex/exportoptions.html',
  controller: Controller,
  controllerAs: 'exportoptions'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'exportoptions';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the exportoptions directive
 * @unrestricted
 */
export class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    super();

    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;
    $scope['showCount'] = $scope['showCount'] === 'true';

    /**
     * @type {number}
     */
    this['count'] = 0;

    /**
     * @type {!Array<!osx.ChecklistItem>}
     */
    this['sourceItems'] = [];

    /**
     * @type {boolean}
     */
    this['useSelected'] = true;

    this.listenKeys = {};

    this.initSources_();
    var dm = DataManager.getInstance();
    dm.listen(DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
    dm.listen(DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);

    this.scope.$on(ChecklistEvent.CHANGE + ':sourcelist', this.onSourceListChanged_.bind(this));
    this.scope.$watch('showLabels', this.updateItems.bind(this));

    $scope.$on('$destroy', this.dispose.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.scope = null;

    var dm = DataManager.getInstance();
    dm.unlisten(DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
    dm.unlisten(DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);

    var sources = DataManager.getInstance().getSources();
    for (var i = 0, n = sources.length; i < n; i++) {
      unlistenByKey(this.listenKeys[sources[i].getId()]);
    }
  }

  /**
   * Create a checklist item from a source.
   *
   * @param {!ISource} source The source
   * @param {boolean=} opt_enabled If the item should be enabled
   * @return {!osx.ChecklistItem}
   * @private
   */
  createChecklistItem_(source, opt_enabled) {
    return {
      enabled: opt_enabled !== undefined ? opt_enabled : false,
      label: source.getTitle(),
      item: source
    };
  }

  /**
   * If the provided source should be displayed in the list.
   *
   * @param {!ISource} source
   * @return {boolean}
   * @protected
   */
  includeSource(source) {
    return true;
  }

  /**
   * Initialize the data sources available for export. Applications should extend this to provide their data sources.
   *
   * @private
   */
  initSources_() {
    var enabledSources = this.scope['initSources']() || [];
    var sources = DataManager.getInstance().getSources();
    for (var i = 0, n = sources.length; i < n; i++) {
      var source = sources[i];
      if (this.includeSource(source)) {
        if (source.isEnabled() && source.getVisible()) {
          var enabled = enabledSources == 'all' || enabledSources.includes(source);
          this['sourceItems'].push(this.createChecklistItem_(source, enabled));
        }

        this.listenKeys[source.getId()] = listen(source, GoogEventType.PROPERTYCHANGE, this.onSourceChange_, this);
      }
    }

    this.updateItems();
  }

  /**
   * Handle checklist change event.
   *
   * @param {angular.Scope.Event} event
   * @private
   */
  onSourceListChanged_(event) {
    event.stopPropagation();
    this.updateItems();
  }

  /**
   * Handle source change event.
   *
   * @param {PropertyChangeEvent} event The event
   * @private
   */
  onSourceChange_(event) {
    var source = /** @type {ISource} */ (event.currentTarget || event.target);
    if (source) {
      var item = this.getSourceItem_(source);
      var p = event.getProperty();

      if (p === PropertyChange.ENABLED || p === PropertyChange.VISIBLE) {
        if (!source.isEnabled() || !source.getVisible()) {
          // source isn't visible, so remove it from the list
          this.getSourceItem_(source, true);
        } else if (!item) {
          // if a source is made visible while this list is displayed, assume the user wanted to enable it. only do this
          // when multiple sources are allowed!
          var enabled = this.scope['allowMultiple'];
          this['sourceItems'].push(this.createChecklistItem_(source, enabled));
          this.updateItems();
        }
      } else if (p === PropertyChange.LABEL) {
        this.updateItems();
      } else if (item && item.enabled && p) {
        if (sourceEvents.includes(p)) {
          this.updateItems();
        } else if (this['useSelected'] && selectEvents.includes(p)) {
          this.updateItems();
        }
      }
    }
  }

  /**
   * Handle a source being added to the data manager.
   *
   * @param {DataEvent} event The event
   * @private
   */
  onSourceAdded_(event) {
    var source = event.source;
    if (source && this.includeSource(source)) {
      this.listenKeys[source.getId()] =
        listen(/** @type {EventTarget} */ (source), GoogEventType.PROPERTYCHANGE, this.onSourceChange_, this);

      var item = this.getSourceItem_(source);
      if (!item && source.getVisible()) {
        // if a source is made visible while this list is displayed, assume the user wanted to enable it. only do this
        // when multiple sources are allowed!
        var enabled = this.scope['allowMultiple'];
        this['sourceItems'].push(this.createChecklistItem_(source, enabled));
        apply(this.scope);
      }
    }
  }

  /**
   * Handle a source being removed from the data manager.
   *
   * @param {DataEvent} event The event
   * @private
   */
  onSourceRemoved_(event) {
    var source = event.source;
    if (source) {
      unlistenByKey(this.listenKeys[source.getId()]);
      this.getSourceItem_(source, true);
    }
  }

  /**
   * Get the checklist item for a source.
   *
   * @param {ISource} source The source
   * @param {boolean=} opt_remove If the item should be removed
   * @return {osx.ChecklistItem|undefined}
   * @private
   */
  getSourceItem_(source, opt_remove) {
    var item;
    if (source) {
      for (var i = 0, n = this['sourceItems'].length; i < n; i++) {
        if (this['sourceItems'][i].item === source) {
          item = this['sourceItems'][i];

          if (opt_remove) {
            this['sourceItems'].splice(i, 1);

            if (item.enabled) {
              this.updateItems();
            } else {
              apply(this.scope);
            }
          }
          break;
        }
      }
    }

    return item;
  }

  /**
   * Update the items being exported. Applications should extend this to handle how export items are determined.
   *
   * @export
   */
  updateItems() {
    this['count'] = 0;

    if (this.scope) {
      var items = [];
      var sources = [];
      for (var i = 0; i < this['sourceItems'].length; i++) {
        var exportSource = this['sourceItems'][i];
        exportSource.detailText = '';

        if (exportSource.enabled) {
          // export selected items if there are any, otherwise export all visible features
          var source = /** @type {ISource} */ (exportSource.item);
          sources.push(source);

          var sourceItems;
          var features = /** @type {VectorSource} */ (source).getFilteredFeatures();
          var totalCount = features.length;
          if (this['useSelected']) {
            var selected = source.getSelectedItems();
            var selectedCount = selected.length;
            sourceItems = selectedCount > 0 ? selected.slice() : features;

            exportSource.detailText = '(' + String(sourceItems.length);
            if (selectedCount > 0 && selectedCount != totalCount) {
              exportSource.detailText += ' of ' + totalCount + ' features)';
            } else {
              exportSource.detailText += ' ' + this.getPluralText_(totalCount) + ')';
            }
          } else {
            sourceItems = features;
            exportSource.detailText = '(' + String(totalCount) + ' ' + this.getPluralText_(totalCount) + ')';
          }

          if (this.scope['showLabels']) {
            var labelFields = [];

            var id = exportSource.item.getId();
            var cfg = StyleManager.getInstance().getLayerConfig(id);
            if (cfg.labels && sourceItems.length > 0 && !this.isFeatureLevelConfig_(sourceItems)) {
              for (var n = 0; n < cfg.labels.length; n++) {
                if (cfg.labels[n]['column']) {
                  labelFields.push(cfg.labels[n]['column']);
                }
              }

              if (labelFields.length == 0) {
                labelFields.push('None');
              }
              // escape HTML chars to make sure they don't break the DOM
              var labelText = htmlEscape(labelFields.join('/'));
              var labelTip = htmlEscape('Columns that will be used for labels in the exported file: ' +
                   labelFields.join(', '));
              exportSource.detailText += '<div class="nowrap" title="' + labelTip + '">' +
                    'Label' + (labelFields.length > 1 ? 's' : '') + ': ' + labelText +
                    '</div>';
            }
          }
          if (sourceItems && sourceItems.length > 0) {
            items = items.concat(sourceItems);
          }
        }
      }

      this['count'] = items.length;

      this.scope.$emit(ExportOptionsEvent.CHANGE, items, sources);
      apply(this.scope);
    }
  }

  /**
   * Check the array to see if any items have a feature level style.
   *
   * @param {Array<*>} items Array of items to check
   * @return {boolean} True if any of the items in the array have a feature level style
   * @private
   */
  isFeatureLevelConfig_(items) {
    if (items) {
      return items.some(function(item) {
        return !!item.get(StyleType.FEATURE);
      });
    }
    return false;
  }

  /**
   * @param {number} count
   * @return {string}
   * @private
   */
  getPluralText_(count) {
    return count != 1 ? 'features' : 'feature';
  }
}

/**
 * Source events that should trigger an item update.
 * @type {Array<string>}
 */
const sourceEvents = [
  PropertyChange.ENABLED,
  PropertyChange.FEATURES,
  PropertyChange.FEATURE_VISIBILITY,
  PropertyChange.VISIBLE,
  PropertyChange.TIME_FILTER
];

/**
 * Selection events that should trigger an item update.
 * @type {Array<string>}
 */
const selectEvents = [
  SelectionType.ADDED,
  SelectionType.CHANGED,
  SelectionType.REMOVED
];
