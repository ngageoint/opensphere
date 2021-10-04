goog.declareModuleId('os.ui.column.mapping.ColumnMappingExportUI');

import ColumnMappingTag from '../../../column/columnmappingtag.js';
import * as columnmapping from '../../../file/mime/columnmapping.js';
import FilePersistence from '../../../file/persist/filepersistence.js';
import {ROOT} from '../../../os.js';
import Module from '../../module.js';
import {close} from '../../window.js';
import WindowEventType from '../../windoweventtype.js';

const {default: IColumnMapping} = goog.requireType('os.column.IColumnMapping');
const {default: IPersistenceMethod} = goog.requireType('os.ex.IPersistenceMethod');


/**
 * The columnmappingexport directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/column/mapping/columnmappingexport.html',
  controller: Controller,
  controllerAs: 'cmExportCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'columnmappingexport';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the columnmappingexport directive
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    /**
     * @type {Array<IColumnMapping>}
     * @private
     */
    this.mappings_ = $scope['mappings'];

    /**
     * @type {Array<IColumnMapping>}
     * @private
     */
    this.selectedMappings_ = $scope['selectedMappings'];

    /**
     * @type {boolean}
     */
    this['showExportType'] = this.selectedMappings_.length > 0;

    /**
     * @type {string}
     */
    this['exportType'] = 'all';

    /**
     * @type {IPersistenceMethod}
     */
    this['persister'] = null;

    /**
     * @type {Object.<string, IPersistenceMethod>}
     */
    this['persisters'] = persisters;

    // manually add persisters instead of going to the manager
    var filePersister = new FilePersistence();
    this['persisters'][filePersister.getLabel()] = filePersister;
    this['persister'] = filePersister;

    this.scope_.$emit(WindowEventType.READY);
    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * Clean up.
   *
   * @private
   */
  onDestroy_() {
    this.scope_ = null;
    this.element_ = null;
  }

  /**
   * Exports the mappings.
   *
   * @export
   */
  accept() {
    var method = this['persister'];
    var title = /** @type {string} */ (this.scope_['title'] + '.xml');
    var mappings = this['exportType'] === 'all' ? this.mappings_ : this.selectedMappings_;

    var content = '<' + ColumnMappingTag.COLUMN_MAPPINGS + '>';
    for (var i = 0, ii = mappings.length; i < ii; i++) {
      content += mappings[i].writeMapping();
    }
    content += '</' + ColumnMappingTag.COLUMN_MAPPINGS + '>';

    method.save(title, content, columnmapping.TYPE);
    this.close();
  }

  /**
   * Close the window
   *
   * @export
   */
  close() {
    close(this.element_);
  }
}

/**
 * @type {Object<string, !IPersistenceMethod>}
 */
const persisters = {};
