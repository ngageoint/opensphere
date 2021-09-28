goog.declareModuleId('os.ui.util.ArrayScrollDataSourceFactory');

import AbstractService from '../abstractservice.js';
import ArrayScrollDataSource from './arrayscrolldatasource.js';


/**
 */
export default class ArrayScrollDataSourceFactory extends AbstractService {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @param {angular.Scope} scope
   * @param {string} watchExp
   * @return {ArrayScrollDataSource}
   */
  createFromWatch(scope, watchExp) {
    var datasource = new ArrayScrollDataSource(scope['datasource'], scope);
    scope.$watch(watchExp, function(val) {
      datasource.setDataSource(val);
    });

    return datasource;
  }

  /**
   *
   * @param {Array} array
   * @param {angular.Scope} scope
   * @return {Object}
   */
  create(array, scope) {
    return new ArrayScrollDataSource(array, scope);
  }

  /**
   *
   * @param {ArrayScrollDataSource} arrayScrollDataSource
   */
  update(arrayScrollDataSource) {
    arrayScrollDataSource.update();
  }
}


/**
 * Service name to be referenced when looking up via the injector.
 * @type {string}
 * @const
 */
ArrayScrollDataSourceFactory.ID = 'arrayScrollDataSourceFactory';

// load it into angular.
angular.module('ui.scroll').service(ArrayScrollDataSourceFactory.ID, ArrayScrollDataSourceFactory);
