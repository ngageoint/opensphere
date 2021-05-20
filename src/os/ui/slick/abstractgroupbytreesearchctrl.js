goog.provide('os.ui.slick.AbstractGroupByTreeSearchCtrl');

goog.require('goog.Disposable');
goog.require('goog.async.Delay');
goog.require('os.config.Settings');
goog.require('os.ui');

goog.requireType('os.data.groupby.INodeGroupBy');



/**
 * Controller for Layers window
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {number} searchDelay how long to delay the search
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.slick.AbstractGroupByTreeSearchCtrl = function($scope, $element, searchDelay) {
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
   * @type {goog.async.Delay}
   * @protected
   */
  this.searchDelay = new goog.async.Delay(this.onSearch, searchDelay, this);

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
   * @type {os.data.groupby.INodeGroupBy}
   */
  this.scope['view'] = null;

  /**
   * If the group by is enabled
   * @type {boolean}
   */
  this.scope['viewEnabled'] = true;

  /**
   * The group by views
   * @type {Array<os.data.groupby.INodeGroupBy>}
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
   * @type {?os.ui.slick.TreeSearch}
   * @protected
   */
  this.treeSearch = null;

  /**
   * @type {os.ui.action.ActionManager}
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
};
goog.inherits(os.ui.slick.AbstractGroupByTreeSearchCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.slick.AbstractGroupByTreeSearchCtrl.prototype.disposeInternal = function() {
  this.save();

  goog.dispose(this.searchDelay);
  this.searchDelay = null;

  goog.dispose(this.treeSearch);
  this.treeSearch = null;

  this.scope = null;
  this.element = null;
};


/**
 * @protected
 */
os.ui.slick.AbstractGroupByTreeSearchCtrl.prototype.save = function() {
  os.settings.set([this.prefix, this.title, 'openIds'], this.treeSearch.getOpenIds());
};


/**
 * Init defaults
 */
os.ui.slick.AbstractGroupByTreeSearchCtrl.prototype.init = function() {
  // The defaults here are from the old location of the settings, some of which were conflicting. The new
  // prefix allows us to be more specific. The old locations can be removed after a couple of releases.
  var openIds = /** @type {Object<string, boolean>} */ (os.settings.get([this.prefix, this.title, 'openIds'],
      os.settings.get([this.title, 'openIds'], {})));

  this.treeSearch.setOpenIds(openIds);

  var viewKey = /** @type {string} */ (os.settings.get([this.prefix, this.title, 'groupBy'],
      os.settings.get([this.title, 'groupBy'], this.viewDefault)));
  var view = this.scope['views'][viewKey] || this.scope['views'][this.viewDefault];

  this.scope['view'] = view;

  // The "Folder" view was replaced by the toggle checkbox, so if that was selected disable Group By.
  var defaultViewEnabled = viewKey !== 'Folder';
  var viewEnabled = /** @type {boolean} */ (os.settings.get([this.prefix, this.title, 'groupByEnabled'],
      defaultViewEnabled));
  this.scope['viewEnabled'] = viewEnabled;

  this.search();
};


/**
 * Starts a search
 *
 * @export
 */
os.ui.slick.AbstractGroupByTreeSearchCtrl.prototype.search = function() {
  this.searchDelay.start();
};


/**
 * Clears the search
 *
 * @export
 */
os.ui.slick.AbstractGroupByTreeSearchCtrl.prototype.clearSearch = function() {
  this.scope['term'] = '';
  this.search();
  this.element.find('.search').focus();
};


/**
 * On search
 *
 * @protected
 */
os.ui.slick.AbstractGroupByTreeSearchCtrl.prototype.onSearch = function() {
  var t = this.scope['term'];

  var viewEnabled = !!this.scope['viewEnabled'];
  var view = viewEnabled ? this.scope['view'] : null;

  for (var key in this.scope['views']) {
    if (this.scope['views'][key] === view) {
      os.settings.set([this.prefix, this.title, 'groupBy'], key);
      break;
    }
  }

  os.settings.set([this.prefix, this.title, 'groupByEnabled'], viewEnabled);

  // do the search
  this.treeSearch.beginSearch(t, view == -1 ? null : view);
  os.ui.apply(this.scope);
};
