goog.declareModuleId('os.ui.slick.AbstractGroupByTreeSearchCtrl');

import * as ui from '../ui.js';

const Disposable = goog.require('goog.Disposable');
const Delay = goog.require('goog.async.Delay');
const dispose = goog.require('goog.dispose');
const Settings = goog.require('os.config.Settings');

const INodeGroupBy = goog.requireType('os.data.groupby.INodeGroupBy');
const {default: ActionManager} = goog.requireType('os.ui.action.ActionManager');
const {default: TreeSearch} = goog.requireType('os.ui.slick.TreeSearch');


/**
 * Controller for Layers window
 * @unrestricted
 */
export default class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {number} searchDelay how long to delay the search
   * @ngInject
   */
  constructor($scope, $element, searchDelay) {
    super();

    /**
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * @type {Delay}
     * @protected
     */
    this.searchDelay = new Delay(this.onSearch, searchDelay, this);

    /**
     * The title to use for storing values
     * @type {string}
     * @protected
     */
    this.title = '';

    /**
     * The search term
     * @type {string}
     */
    this.scope['term'] = '';

    /**
     * The selected group by view
     * @type {INodeGroupBy}
     */
    this.scope['view'] = null;

    /**
     * If the group by is enabled
     * @type {boolean}
     */
    this.scope['viewEnabled'] = true;

    /**
     * The group by views
     * @type {Array<INodeGroupBy>}
     */
    this.scope['views'] = [];

    /**
     * Default View
     * @type {string}
     * @protected
     */
    this.viewDefault = 'None';

    /**
     * The selected tree rows
     * @type {Array}
     */
    this.scope['selected'] = null;

    /**
     * @type {?TreeSearch}
     * @protected
     */
    this.treeSearch = null;

    /**
     * @type {ActionManager}
     */
    this.scope['contextMenu'] = null;

    /**
     * @type {string}
     * @protected
     */
    this.prefix = 'groupBy';

    $scope.$on('$destroy', this.dispose.bind(this));
    $scope.$on('search', this.onSearch.bind(this));
    $scope.$on('collapseChange', this.save.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.save();

    dispose(this.searchDelay);
    this.searchDelay = null;

    dispose(this.treeSearch);
    this.treeSearch = null;

    this.scope = null;
    this.element = null;
  }

  /**
   * @protected
   */
  save() {
    Settings.getInstance().set([this.prefix, this.title, 'openIds'], this.treeSearch.getOpenIds());
  }

  /**
   * Init defaults
   */
  init() {
    const settings = Settings.getInstance();

    // The defaults here are from the old location of the settings, some of which were conflicting. The new
    // prefix allows us to be more specific. The old locations can be removed after a couple of releases.
    var openIds = /** @type {Object<string, boolean>} */ (settings.get([this.prefix, this.title, 'openIds'],
        settings.get([this.title, 'openIds'], {})));

    this.treeSearch.setOpenIds(openIds);

    var viewKey = /** @type {string} */ (settings.get([this.prefix, this.title, 'groupBy'],
        settings.get([this.title, 'groupBy'], this.viewDefault)));
    var view = this.scope['views'][viewKey] || this.scope['views'][this.viewDefault];

    this.scope['view'] = view;

    // The "Folder" view was replaced by the toggle checkbox, so if that was selected disable Group By.
    var defaultViewEnabled = viewKey !== 'Folder';
    var viewEnabled = /** @type {boolean} */ (settings.get([this.prefix, this.title, 'groupByEnabled'],
        defaultViewEnabled));
    this.scope['viewEnabled'] = viewEnabled;

    this.search();
  }

  /**
   * Starts a search
   *
   * @export
   */
  search() {
    this.searchDelay.start();
  }

  /**
   * Clears the search
   *
   * @export
   */
  clearSearch() {
    this.scope['term'] = '';
    this.search();
    this.element.find('.search').focus();
  }

  /**
   * On search
   *
   * @protected
   */
  onSearch() {
    var t = this.scope['term'];

    var viewEnabled = !!this.scope['viewEnabled'];
    var view = viewEnabled ? this.scope['view'] : null;

    for (var key in this.scope['views']) {
      if (this.scope['views'][key] === view) {
        Settings.getInstance().set([this.prefix, this.title, 'groupBy'], key);
        break;
      }
    }

    Settings.getInstance().set([this.prefix, this.title, 'groupByEnabled'], viewEnabled);

    // do the search
    this.treeSearch.beginSearch(t, view == -1 ? null : view);
    ui.apply(this.scope);
  }
}
