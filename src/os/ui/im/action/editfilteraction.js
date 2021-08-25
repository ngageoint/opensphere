goog.module('os.ui.im.action.EditFilterActionCtrl');
goog.module.declareLegacyNamespace();

const dispatcher = goog.require('os.Dispatcher');
const DataManager = goog.require('os.data.DataManager');
const {sortByLabel} = goog.require('os.im.action');
const ImportActionManager = goog.require('os.im.action.ImportActionManager');
const {apply} = goog.require('os.ui');
const {Controller: EditFiltersCtrl} = goog.require('os.ui.filter.ui.EditFiltersUI');
const EventType = goog.require('os.ui.im.action.EventType');
const osWindow = goog.require('os.ui.window');

const FilterActionEntry = goog.requireType('os.im.action.FilterActionEntry');
const IImportAction = goog.requireType('os.im.action.IImportAction');


/**
 * Controller for the edit filter action window.
 *
 * @template T
 * @unrestricted
 */
class Controller extends EditFiltersCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    var iam = ImportActionManager.getInstance();

    /**
     * All actions registered in the application.
     * @type {!Array<!IImportAction<T>>}
     * @private
     */
    this.registeredActions_ = iam.getActions().sort(sortByLabel);

    /**
     * The start index for drag operations.
     * @type {number}
     * @private
     */
    this.startIndex_ = -1;

    /**
     * Configured filter actions.
     * @type {!Array<!IImportAction<T>>}
     */
    this['actions'] = [];

    /**
     * Available filter actions.
     * @type {!Array<!IImportAction<T>>}
     */
    this['availableActions'] = [];

    var filterEntry = /** @type {FilterActionEntry} */ (this.entry);
    if (filterEntry && filterEntry.actions) {
      var actions = filterEntry.actions.slice();
      for (var i = 0; i < actions.length; i++) {
        this['actions'].push({
          'id': actions[i].getId(),
          'action': actions[i]
        });
      }
    }

    // make the labels sortable via drag handle
    this.element.find('.action-container').sortable({
      'items': '.filter-action-row',
      'handle': '.handle',
      'axis': 'y',
      'containment': 'parent',
      'snap': true,
      'tolerance': 'pointer',
      'start': this.onDragStart_.bind(this),
      'stop': this.onDragEnd_.bind(this)
    });

    this.updateAvailableActions();

    // prefill an action if the entry didn't have any
    if (this['actions'].length == 0) {
      this.addAction();
    }

    $scope.$on('$destroy', this.onDestroy.bind(this));
    DataManager.getInstance().listen(os.data.event.DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);
  }

  /**
   * Add a new filter action.
   *
   * @export
   */
  addAction() {
    if (this['availableActions'].length > 0) {
      var iam = ImportActionManager.getInstance();
      var actionId = /** @type {string} */ (this['availableActions'][0]['id']);
      var action = iam.createAction(actionId);
      if (action) {
        this['actions'].push({
          'id': actionId,
          'action': action
        });

        this.updateAvailableActions();
      }
    }
  }

  /**
   * Remove an action.
   *
   * @param {number} index The import action index.
   * @export
   */
  removeAction(index) {
    if (index > -1 && index < this['actions'].length) {
      this['actions'].splice(index, 1);
      this.updateAvailableActions();
      dispatcher.getInstance().dispatchEvent(EventType.UPDATE);
    }
  }

  /**
   * Update an action type.
   *
   * @param {number} index The action index.
   * @export
   */
  updateAction(index) {
    var actionObj = this['actions'][index];
    if (actionObj && actionObj['id'] != actionObj['action'].getId()) {
      var iam = ImportActionManager.getInstance();
      var action = iam.createAction(actionObj['id']);
      if (action) {
        actionObj['action'] = action;
        this.updateAvailableActions();
      }
      dispatcher.getInstance().dispatchEvent(EventType.UPDATE);
    }
  }

  /**
   * Update the list of actions that can be added.
   *
   * @protected
   */
  updateAvailableActions() {
    this['availableActions'].length = 0;

    for (var i = 0; i < this.registeredActions_.length; i++) {
      var action = this.registeredActions_[i];
      if (!action.isUnique() || !this['actions'].some(function(obj) {
        return obj['id'] == action.getId();
      })) {
        this['availableActions'].push({
          'id': action.getId(),
          'label': action.getLabel()
        });
      }
    }
  }

  /**
   * Configure an action.
   *
   * @param {IImportAction<T>} action The import action.
   * @export
   */
  configAction(action) {
    if (this.entry && action) {
      launchActionConfig(action, this.entry.getType());
    }
  }

  /**
   * Close the edit filter action window if the source was removed
   *
   * @param {os.data.event.DataEvent} event
   * @private
   */
  onSourceRemoved_(event) {
    if (event && event.source) {
      if (this.entry && this.entry.getType() == event.source.getId()) {
        this.cancel();
      }
    }
  }

  /**
   * @inheritDoc
   */
  onDestroy() {
    super.onDestroy();
    DataManager.getInstance().unlisten(os.data.event.DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);
  }

  /**
   * @inheritDoc
   * @export
   */
  cancel() {
    closeActionConfigWindow();
    super.cancel();
  }

  /**
   * @inheritDoc
   * @export
   */
  finish() {
    closeActionConfigWindow();

    var filterEntry = /** @type {FilterActionEntry} */ (this.entry);
    filterEntry.actions = this['actions'].map(function(item) {
      return item['action'];
    });

    super.finish();
  }

  /**
   * @inheritDoc
   * @export
   */
  isInvalid() {
    if (this['actions'].length == 0) {
      return true;
    }

    return super.isInvalid();
  }

  /**
   * Get the tooltip to display over the Add Action button.
   *
   * @return {string}
   * @export
   */
  getAddActionTooltip() {
    if (this['availableActions'].length > 0) {
      return 'Add a new action';
    } else {
      return 'All available actions have been added';
    }
  }

  /**
   * Handle label drag start.
   *
   * @param {!jQuery.Event} event
   * @param {!{item: jQuery, placeholder: jQuery}} ui
   * @private
   */
  onDragStart_(event, ui) {
    // add a buffer to the bottom of the containment to account for the container padding
    var sortable = this.element.find('.action-container').sortable('instance');
    if (sortable && sortable['containment']) {
      sortable['containment'][3] += 3;
    }

    // placeholder should be the same height as the item being dragged so the container size doesn't change
    if (ui['helper'] && ui['placeholder']) {
      ui['placeholder'].height(ui['helper'].height());
    }

    if (ui['item']) {
      // show the grippy dragging cursor
      ui['item'].find('.handle').addClass('moving');

      // save the start index
      this.startIndex_ = ui['item'].index();
    }
  }

  /**
   * Handle label drag end.
   *
   * @param {!jQuery.Event} event
   * @param {!{item: Element}} ui
   * @private
   */
  onDragEnd_(event, ui) {
    if (ui['item']) {
      // revert to grippy hover cursor
      ui['item'].find('.handle').removeClass('moving');

      // if the index changed, update the label order
      var stopIndex = ui['item'].index();
      if (this.startIndex_ != stopIndex) {
        goog.array.moveItem(this['actions'], this.startIndex_, stopIndex);
        apply(this.scope);
      }
    }
  }
}


/**
 * Window id for configuring an import action.
 * @type {string}
 */
const ACTION_CONFIG_ID = 'importActionConfig';


/**
 * Closes the expression edit window.
 */
const closeActionConfigWindow = function() {
  osWindow.close(osWindow.getById(ACTION_CONFIG_ID));
};


/**
 * Launch a dialog to configure an import action.
 *
 * @param {!IImportAction} action The action.
 * @param {string} type The action entry type.
 */
const launchActionConfig = function(action, type) {
  if (osWindow.exists(ACTION_CONFIG_ID)) {
    // don't open multiple of this window
    return;
  }

  var ui = action.getConfigUI();
  if (ui) {
    var scopeOptions = {
      'action': action,
      'type': type,
      'yesText': 'OK',
      'yesIcon': 'fa fa-check',
      'yesButtonClass': 'btn-primary',
      'noText': 'Cancel',
      'noIcon': 'fa fa-ban',
      'noButtonClass': 'btn-secondary'
    };

    var windowOptions = {
      'id': ACTION_CONFIG_ID,
      'label': action.getLabel(),
      'icon': 'fa fa-gear',
      'x': 'center',
      'y': 'center',
      'width': 350,
      'min-width': 200,
      'max-width': 2000,
      'height': 'auto',
      'modal': true,
      'show-close': false
    };

    var template = '<confirm><' + ui + '></' + ui + '></confirm>';
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};

exports = Controller;
