goog.module('os.layer.preset.PresetMenuButton');
goog.module.declareLegacyNamespace();

const LayerPresetManager = goog.require('os.layer.preset.LayerPresetManager');
const MenuButtonCtrl = goog.require('os.ui.menu.MenuButtonCtrl');
const Menu = goog.require('os.ui.menu.Menu');
const MenuItem = goog.require('os.ui.menu.MenuItem');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');
const Module = goog.require('os.ui.Module');
const {Presets: Metrics} = goog.require('os.metrics.keys');


/**
 * @const {string}
 */
const MENU_FLAG = 'presets';

/**
 * Preset events
 * @enum {string}
 */
const EventType = {
  REMOVE: 'remove',
  SAVE: 'save',
  TOGGLE_DEFAULT_TRUE: 'toggle-default-true',
  TOGGLE_DEFAULT_FALSE: 'toggle-default-false',
  TOGGLE_PUBLISHED_TRUE: 'toggle-published-true',
  TOGGLE_PUBLISHED_FALSE: 'toggle-published-false'
};

/**
 * The controller for the preset directive; make use of the MenuButtonController
 */
class Controller extends MenuButtonCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element The element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    /**
     * @type {boolean}
     */
    this['isAdmin'] = false;

    this.init_();
  }

  /**
   * @private
   */
  init_() {
    this['isAdmin'] = LayerPresetManager.getInstance().isAdmin(); // requires ng-if

    // build the menu
    this.menu = new Menu(new MenuItem({
      type: MenuItemType.ROOT,
      children: [{
        label: '',
        type: MenuItemType.GROUP,
        sort: 0,
        beforeRender: this.visibility.bind(this),
        children: [{
          label: 'Save as...',
          eventType: EventType.SAVE,
          tooltip: 'Save Preset',
          icons: ['<i class="fa fa-fw fa-floppy-o"></i>'],
          handler: this.save.bind(this),
          metricKey: Metrics.SAVE,
          sort: 0
        }, {
          label: 'Publish',
          eventType: EventType.TOGGLE_PUBLISHED_TRUE,
          tooltip: 'Make Preset visible to everyone',
          icons: ['<i class="fa fa-fw fa-eye"></i>'],
          handler: this.togglePublished.bind(this),
          metricKey: Metrics.TOGGLE_PUBLISHED,
          sort: 10
        }, {
          label: 'Draft',
          eventType: EventType.TOGGLE_PUBLISHED_FALSE,
          tooltip: 'Return Preset to draft mode',
          icons: ['<i class="fa fa-fw fa-eye-slash"></i>'],
          handler: this.togglePublished.bind(this),
          metricKey: Metrics.TOGGLE_PUBLISHED,
          sort: 11
        }, {
          label: 'Set as Default',
          eventType: EventType.TOGGLE_DEFAULT_TRUE,
          tooltip: 'Make Preset the default style when layer added',
          icons: ['<i class="fa fa-fw fa-star"></i>'],
          handler: this.toggleDefault.bind(this),
          metricKey: Metrics.TOGGLE_DEFAULT,
          sort: 20
        }, {
          label: 'Revoke Default',
          eventType: EventType.TOGGLE_DEFAULT_FALSE,
          tooltip: 'Undo making Preset the default style when layer added',
          icons: ['<i class="fa fa-fw fa-star-o"></i>'],
          handler: this.toggleDefault.bind(this),
          metricKey: Metrics.TOGGLE_DEFAULT,
          sort: 21
        }, {
          label: 'Delete',
          eventType: EventType.REMOVE,
          tooltip: 'Permanently delete Preset',
          icons: ['<i class="fa fa-fw fa-close"></i>'],
          handler: this.remove.bind(this),
          metricKey: Metrics.REMOVE,
          sort: 30
        }]
      }]
    }));
    this.flag = MENU_FLAG;
    this.metricKey = Metrics.OPEN;
  }

  /**
   * Angular $onDestroy lifecycle hook.
   */
  $onDestroy() {
    this.scope = null;
  }

  /**
   *
   */
  remove() {
    const preset = this.scope['parentCtrl']['preset'];

    console.log(`preset.remove(${preset.label})`);
  }

  /**
   *
   */
  save() {
    const preset = this.scope['parentCtrl']['preset'];

    console.log(`preset.save(${preset.label})`, preset);
  }

  /**
   *
   */
  toggleDefault() {
    const preset = this.scope['parentCtrl']['preset'];

    console.log(`preset.toggleDefault(${preset.label}), was: ${preset.default}`);
  }

  /**
   *
   */
  togglePublished() {
    const preset = this.scope['parentCtrl']['preset'];

    console.log(`preset.togglePublished(${preset.label}), was: ${preset.published}`);
  }

  /**
   *
   */
  visibility() {
    const preset = this.scope['parentCtrl']['preset'];

    if (preset) {
      const publishTrue = this.menu.getRoot().find(EventType.TOGGLE_PUBLISHED_TRUE);
      const publishFalse = this.menu.getRoot().find(EventType.TOGGLE_PUBLISHED_FALSE);
      const defaultTrue = this.menu.getRoot().find(EventType.TOGGLE_DEFAULT_TRUE);
      const defaultFalse = this.menu.getRoot().find(EventType.TOGGLE_DEFAULT_FALSE);

      if (publishTrue) publishTrue.visible = !preset.published;
      if (publishFalse) publishFalse.visible = preset.published;
      if (defaultTrue) defaultTrue.visible = !preset.default;
      if (defaultFalse) defaultFalse.visible = preset.default;
    }
  }
}

/**
 * The preset directive.
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'parentCtrl': '='
  },
  controller: Controller,
  controllerAs: 'ctrl',
  template: `
<div class="btn-group o-add-data-button" ng-right-click="ctrl.openMenu()">
  <button type="button" class="btn btn-primary col-auto" ng-click="parentCtrl.applyPreset()"
    title="Apply the layer style preset">
    <i class="fa fa-check"></i>
    Apply
  </button>
  <button class="btn btn-primary dropdown-toggle dropdown-toggle-split" 
    ng-if="ctrl.isAdmin" 
    ng-click="ctrl.openMenu()"
    ng-class="{active: menu}">
  </button>
</div>
`
});


/**
 * Add the directive to the module.
 */
Module.directive('presetmenubutton', [directive]);


exports = {directive, Controller};
