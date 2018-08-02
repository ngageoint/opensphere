goog.provide('os.ui.util.ArrayScrollDataSource');
goog.provide('os.ui.util.ArrayScrollDataSourceFactory');
goog.require('goog.Disposable');
goog.require('os.ui.AbstractService');



/**
 * angular-ui-utils ng-scroll directive requires a DataSource object to provide data for its infinite scroll capability.
 * This object implements that API using an array as the source.
 *
 * Example: var dataSource = new os.ui.util.ArrayScrollDataSource(myArrayOfItems);
 *
 * @param {Array} array
 * @param {angular.Scope} scope
 *
 * @constructor
 * @extends {goog.Disposable}
 */
os.ui.util.ArrayScrollDataSource = function(array, scope) {
  /**
   * @type {Array}
   * @private
   */
  var datasource_ = array;

  /**
   * @type {number}
   * @private
   */
  var revision_ = 0;

  /**
   * @type {?angular.Scope}
   * @private
   */
  var scope_ = scope;

  /**
   * @param {Array} array
   */
  this.setDataSource = function(array) {
    datasource_ = array;
    revision_ = revision_ += 1;
  };


  /**
   * @param {boolean} value
   */
  this.loading = function(value) {
    if (scope_) {
      scope_['dataSourceLoading'] = value;
    }
  };


  /**
   * @param {number} index
   * @param {number} count
   * @param {function(Array)} onSuccess
   * @this os.ui.util.ArrayScrollDataSource
   */
  this.get = function(index, count, onSuccess) {
    var result;
    if (!datasource_) {
      result = [];
    } else {
      var offset = 0;
      if (index <= 0) {
        // Checks the indexing to ensure we aren't looking for an element off the top of the datasource array
        // If index is, say, -4, we only want to pull elements 0-5
        offset = index - 1;
        index = 1;
      }
      var start = index - 1;
      var end = Math.min(start + count + offset, datasource_.length + 1);
      result = datasource_.slice(start, end);
    }
    onSuccess(result);
  };


  /**
   * @return {number}
   */
  this.revision = function() {
    return revision_;
  };


  /**
   * Update
   */
  this.update = function() {
    revision_ = revision_ += 1;
  };


  /**
   * Cleanup
   */
  this.disposeInternal = function() {
    os.ui.util.ArrayScrollDataSource.superClass_.disposeInternal.call(this);
    datasource_ = null;
    scope_ = null;
  };
};
goog.inherits(os.ui.util.ArrayScrollDataSource, goog.Disposable);



/**
 *
 * @extends {os.ui.AbstractService}
 * @constructor
 * @ngInject
 */
os.ui.util.ArrayScrollDataSourceFactory = function() {
  os.ui.util.ArrayScrollDataSourceFactory.base(this, 'constructor');
};
goog.inherits(os.ui.util.ArrayScrollDataSourceFactory, os.ui.AbstractService);


/**
 * Service name to be referenced when looking up via the injector.
 * @type {string}
 * @const
 */
os.ui.util.ArrayScrollDataSourceFactory.ID = 'arrayScrollDataSourceFactory';

// load it into angular.
angular.module('ui.scroll').service(
    os.ui.util.ArrayScrollDataSourceFactory.ID, os.ui.util.ArrayScrollDataSourceFactory);


/**
 * @param {angular.Scope} scope
 * @param {string} watchExp
 * @return {os.ui.util.ArrayScrollDataSource}
 */
os.ui.util.ArrayScrollDataSourceFactory.prototype.createFromWatch = function(scope, watchExp) {
  var datasource = new os.ui.util.ArrayScrollDataSource(scope['datasource'], scope);
  scope.$watch(watchExp, function(val) {
    datasource.setDataSource(val);
  });

  return datasource;
};


/**
 *
 * @param {Array} array
 * @param {angular.Scope} scope
 * @return {Object}
 */
os.ui.util.ArrayScrollDataSourceFactory.prototype.create = function(array, scope) {
  return new os.ui.util.ArrayScrollDataSource(array, scope);
};


/**
 *
 * @param {os.ui.util.ArrayScrollDataSource} arrayScrollDataSource
 */
os.ui.util.ArrayScrollDataSourceFactory.prototype.update = function(arrayScrollDataSource) {
  arrayScrollDataSource.update();
};
