goog.provide('os.ui.slick.AbstractGroupByTreeSearchCtrl');

goog.require('goog.Disposable');
goog.require('goog.async.Delay');
goog.require('os.config.Settings');
goog.require('os.ui');



/**
 * Controller for Layers window
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
   * @protected
   */
  this.scope['term'] = '';

  /**
   * The group by views
   * @type {Array}
   * @protected
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
   * @protected
   */
  this.scope['contextMenu'] = null;

  $scope.$on('$destroy', this.dispose.bind(this));
  $scope.$on('search', this.onSearch.bind(this));
  $scope.$on('collapseChange', this.save.bind(this));

  /**
   * @type {string}
   * @protected
   */
  this.prefix = 'groupBy';
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

  this.scope['view'] = this.scope['views'][viewKey];
  this.search();
};


/**
 * Starts a search
 * @export
 */
os.ui.slick.AbstractGroupByTreeSearchCtrl.prototype.search = function() {
  this.searchDelay.start();
};


/**
 * Clears the search
 * @export
 */
os.ui.slick.AbstractGroupByTreeSearchCtrl.prototype.clearSearch = function() {
  this.scope['term'] = '';
  this.search();
  this.element.find('.search').focus();
};


/**
 * On search
 * @protected
 */
os.ui.slick.AbstractGroupByTreeSearchCtrl.prototype.onSearch = function() {
  var t = this.scope['term'];

  for (var key in this.scope['views']) {
    if (this.scope['views'][key] === this.scope['view']) {
      os.settings.set([this.prefix, this.title, 'groupBy'], key);
      break;
    }
  }

  // do the search
  this.treeSearch.beginSearch(t, this.scope['view'] == -1 ? null : this.scope['view']);
  os.ui.apply(this.scope);
};
