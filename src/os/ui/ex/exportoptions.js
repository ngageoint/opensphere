goog.provide('os.ui.ex.ExportOptionsCtrl');
goog.provide('os.ui.ex.ExportOptionsEvent');
goog.provide('os.ui.ex.exportOptionsDirective');
goog.require('goog.Disposable');
goog.require('os.data.OSDataManager');
goog.require('os.defines');
goog.require('os.events.SelectionType');
goog.require('os.source.PropertyChange');
goog.require('os.ui.Module');
goog.require('os.ui.checklistDirective');


/**
 * @enum {string}
 */
os.ui.ex.ExportOptionsEvent = {
  CHANGE: 'exportoptions:change'
};


/**
 * The exportoptions directive
 * @return {angular.Directive}
 */
os.ui.ex.exportOptionsDirective = function() {
  return {
    restrict: 'E',
    scope: {
      'allowMultiple': '=',
      'showLabels': '=',
      'initSources': '&',
      'showCount': '@'
    },
    templateUrl: os.ROOT + 'views/ex/exportoptions.html',
    controller: os.ui.ex.ExportOptionsCtrl,
    controllerAs: 'exportoptions'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('exportoptions', [os.ui.ex.exportOptionsDirective]);



/**
 * Controller function for the exportoptions directive
 * @param {!angular.Scope} $scope
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.ex.ExportOptionsCtrl = function($scope) {
  os.ui.ex.ExportOptionsCtrl.base(this, 'constructor');

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

  this.initSources_();
  var dm = os.dataManager;
  dm.listen(os.data.event.DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
  dm.listen(os.data.event.DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);

  this.scope.$on(os.ui.ChecklistEvent.CHANGE + ':sourcelist', this.onSourceListChanged_.bind(this));
  this.scope.$watch('showLabels', this.updateItems.bind(this));

  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(os.ui.ex.ExportOptionsCtrl, goog.Disposable);


/**
 * Source events that should trigger an item update.
 * @type {Array<string>}
 * @const
 * @private
 */
os.ui.ex.ExportOptionsCtrl.SOURCE_EVENTS_ = [
  os.source.PropertyChange.FEATURES,
  os.source.PropertyChange.FEATURE_VISIBILITY,
  os.source.PropertyChange.VISIBLE,
  os.source.PropertyChange.TIME_FILTER
];


/**
 * Selection events that should trigger an item update.
 * @type {Array<string>}
 * @const
 * @private
 */
os.ui.ex.ExportOptionsCtrl.SELECT_EVENTS_ = [
  os.events.SelectionType.ADDED,
  os.events.SelectionType.CHANGED,
  os.events.SelectionType.REMOVED
];


/**
 * @inheritDoc
 */
os.ui.ex.ExportOptionsCtrl.prototype.disposeInternal = function() {
  os.ui.ex.ExportOptionsCtrl.base(this, 'disposeInternal');

  this.scope = null;

  var dm = os.dataManager;
  dm.unlisten(os.data.event.DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
  dm.unlisten(os.data.event.DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);

  var sources = os.osDataManager.getSources();
  for (var i = 0, n = sources.length; i < n; i++) {
    ol.events.unlisten(sources[i], goog.events.EventType.PROPERTYCHANGE, this.onSourceChange_, this);
  }
};


/**
 * Create a checklist item from a source.
 * @param {!os.source.ISource} source The source
 * @param {boolean=} opt_enabled If the item should be enabled
 * @return {!osx.ChecklistItem}
 * @private
 */
os.ui.ex.ExportOptionsCtrl.prototype.createChecklistItem_ = function(source, opt_enabled) {
  return /** @type {!osx.ChecklistItem} */ ({
    enabled: goog.isDef(opt_enabled) ? opt_enabled : false,
    label: source.getTitle(),
    item: source
  });
};


/**
 * If the provided source should be displayed in the list.
 * @param {!os.source.ISource} source
 * @return {boolean}
 * @protected
 */
os.ui.ex.ExportOptionsCtrl.prototype.includeSource = function(source) {
  return true;
};


/**
 * Initialize the data sources available for export. Applications should extend this to provide their data sources.
 * @private
 */
os.ui.ex.ExportOptionsCtrl.prototype.initSources_ = function() {
  var enabledSources = this.scope['initSources']() || [];
  var sources = os.osDataManager.getSources();
  for (var i = 0, n = sources.length; i < n; i++) {
    var source = sources[i];
    if (this.includeSource(source)) {
      if (source.getVisible()) {
        var enabled = enabledSources == 'all' || goog.array.contains(enabledSources, source);
        this['sourceItems'].push(this.createChecklistItem_(source, enabled));
      }

      ol.events.listen(source, goog.events.EventType.PROPERTYCHANGE, this.onSourceChange_, this);
    }
  }

  this.updateItems();
};


/**
 * Handle checklist change event.
 * @param {angular.Scope.Event} event
 * @private
 */
os.ui.ex.ExportOptionsCtrl.prototype.onSourceListChanged_ = function(event) {
  event.stopPropagation();
  this.updateItems();
};


/**
 * Handle source change event.
 * @param {os.events.PropertyChangeEvent} event The event
 * @private
 */
os.ui.ex.ExportOptionsCtrl.prototype.onSourceChange_ = function(event) {
  var source = /** @type {os.source.ISource} */ (event.currentTarget || event.target);
  if (source) {
    var item = this.getSourceItem_(source);
    var p = event.getProperty();

    if (p === os.source.PropertyChange.VISIBLE) {
      if (!source.getVisible()) {
        // source isn't visible, so remove it from the list
        this.getSourceItem_(source, true);
      } else if (!item) {
        // if a source is made visible while this list is displayed, assume the user wanted to enable it. only do this
        // when multiple sources are allowed!
        var enabled = this.scope['allowMultiple'];
        this['sourceItems'].push(this.createChecklistItem_(source, enabled));
        this.updateItems();
      }
    } else if (p === os.source.PropertyChange.LABEL) {
      this.updateItems();
    } else if (item && item.enabled) {
      if (goog.array.contains(os.ui.ex.ExportOptionsCtrl.SOURCE_EVENTS_, p)) {
        this.updateItems();
      } else if (this['useSelected'] && goog.array.contains(os.ui.ex.ExportOptionsCtrl.SELECT_EVENTS_, p)) {
        this.updateItems();
      }
    }
  }
};


/**
 * Handle a source being added to the data manager.
 * @param {os.data.event.DataEvent} event The event
 * @private
 */
os.ui.ex.ExportOptionsCtrl.prototype.onSourceAdded_ = function(event) {
  var source = event.source;
  if (source && this.includeSource(source)) {
    ol.events.listen(/** @type {ol.events.EventTarget} */ (source), goog.events.EventType.PROPERTYCHANGE,
        this.onSourceChange_, this);

    var item = this.getSourceItem_(source);
    if (!item && source.getVisible()) {
      // if a source is made visible while this list is displayed, assume the user wanted to enable it. only do this
      // when multiple sources are allowed!
      var enabled = this.scope['allowMultiple'];
      this['sourceItems'].push(this.createChecklistItem_(source, enabled));
      os.ui.apply(this.scope);
    }
  }
};


/**
 * Handle a source being removed from the data manager.
 * @param {os.data.event.DataEvent} event The event
 * @private
 */
os.ui.ex.ExportOptionsCtrl.prototype.onSourceRemoved_ = function(event) {
  var source = event.source;
  if (source) {
    ol.events.unlisten(/** @type {ol.events.EventTarget} */ (source), goog.events.EventType.PROPERTYCHANGE,
        this.onSourceChange_, this);
    this.getSourceItem_(source, true);
  }
};


/**
 * Get the checklist item for a source.
 * @param {os.source.ISource} source The source
 * @param {boolean=} opt_remove If the item should be removed
 * @return {osx.ChecklistItem|undefined}
 * @private
 */
os.ui.ex.ExportOptionsCtrl.prototype.getSourceItem_ = function(source, opt_remove) {
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
            os.ui.apply(this.scope);
          }
        }
        break;
      }
    }
  }

  return item;
};


/**
 * Update the items being exported. Applications should extend this to handle how export items are determined.
 */
os.ui.ex.ExportOptionsCtrl.prototype.updateItems = function() {
  this['count'] = 0;

  if (this.scope) {
    var items = [];
    var sources = [];
    for (var i = 0; i < this['sourceItems'].length; i++) {
      var exportSource = this['sourceItems'][i];
      exportSource.detailText = '';

      if (exportSource.enabled) {
        // export selected items if there are any, otherwise export all visible features
        var source = /** @type {os.source.ISource} */ (exportSource.item);
        sources.push(source);

        var sourceItems;
        var features = source.getFilteredFeatures();
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
          var cfg = os.style.StyleManager.getInstance().getLayerConfig(id);
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
            var labelText = goog.string.htmlEscape(labelFields.join('/'));
            var labelTip = goog.string.htmlEscape('Columns that will be used for labels in the exported file: ' +
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

    this.scope.$emit(os.ui.ex.ExportOptionsEvent.CHANGE, items, sources);
    os.ui.apply(this.scope);
  }
};
goog.exportProperty(
    os.ui.ex.ExportOptionsCtrl.prototype,
    'updateItems',
    os.ui.ex.ExportOptionsCtrl.prototype.updateItems);

/**
 * Check the array to see if any items have a feature level style.
 * @param {Array<*>} items Array of items to check
 * @return {boolean} True if any of the items in the array have a feature level style
 * @private
 */
os.ui.ex.ExportOptionsCtrl.prototype.isFeatureLevelConfig_ = function(items) {
  if (items) {
    return items.some(function(item) {
      return !!item.get(os.style.StyleType.FEATURE);
    });
  }
  return false;
};


/**
 * @param {number} count
 * @return {string}
 * @private
 */
os.ui.ex.ExportOptionsCtrl.prototype.getPluralText_ = function(count) {
  return count != 1 ? 'features' : 'feature';
};
