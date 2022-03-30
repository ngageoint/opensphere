goog.declareModuleId('os.ui.column.ColumnManagerUI');

import {findIndex, remove} from 'ol/src/array.js';

import {ROOT} from '../../os.js';
import Module from '../module.js';
import {findByField, numerateNameCompare} from '../slick/column.js';
import {columnFormatter} from '../slick/formatter.js';
import SlickGridEvent from '../slick/slickgridevent.js';
import {close} from '../window.js';
import {directiveTag as columnRowUi} from './columnrow.js';

const {moveItem} = goog.require('goog.array');
const dispose = goog.require('goog.dispose');
const {getDocument} = goog.require('goog.dom');
const KeyCodes = goog.require('goog.events.KeyCodes');
const KeyEvent = goog.require('goog.events.KeyEvent');
const KeyHandler = goog.require('goog.events.KeyHandler');

const {default: ColumnDefinition} = goog.requireType('os.data.ColumnDefinition');


/**
 * The columnManager directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'columns': '=',
    'acceptCallback': '=',
    'shownCallback': '='
  },
  templateUrl: ROOT + 'views/column/columnmanager.html',
  controller: Controller,
  controllerAs: 'columnManager'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'column-manager';

/**
 * Add the directive to the module.
 */
Module.directive('columnManager', [directive]);

/**
 * Controller function for the columnManager directive
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
     * @type {Object<string, ColumnDefinition>}
     * @private
     */
    this.sourceColumns_ = {};

    /**
     * @type {Array<ColumnDefinition>}
     */
    this['shownColumns'] = [];

    /**
     * @type {?Array<ColumnDefinition>}
     */
    this['shownSelected'] = [];

    /**
     * @type {Array<ColumnDefinition>}
     */
    this['hiddenColumns'] = [];

    /**
     * @type {?Array<ColumnDefinition>}
     */
    this['hiddenSelected'] = [];

    /**
     * @type {Array<{col: ColumnDefinition, list: string}>}
     */
    this['searchResults'] = [];

    /**
     * @type {number}
     */
    this['searchIndex'] = 0;

    /**
     * @type {string}
     */
    this['term'] = '';

    /**
     * @type {boolean}
     */
    this['valid'] = true;

    // clone all of the source columns and put them in the model so they only change when the user hits OK
    for (var i = 0; i < this.scope_['columns'].length; i++) {
      var srcCol = this.scope_['columns'][i];
      if (srcCol['visible']) {
        this['shownColumns'].push(srcCol.clone());
      } else if (!srcCol['visprotected']) {
        this['hiddenColumns'].push(srcCol.clone());
      }
      this.sourceColumns_[srcCol['id']] = srcCol;
    }

    this['hiddenColumns'].sort(numerateNameCompare);

    /**
     * Slick grid table options
     * @type {Object<string, *>}
     */
    this['tableOptions'] = {
      'fullWidthRows': true,
      'forceFitColumns': true,
      'multiSelect': true,
      'sortable': true,
      'multiColumnSort': true,
      'useRowRenderEvents': true,
      'dataItemColumnValueExtractor': this.getColumnValue_
    };

    /**
     * Slick grid table column definitions.
     * @type {!Array<*>}
     */
    this['hiddenConfig'] = [{
      'id': 'hidden',
      'name': 'Hidden',
      'field': 'name',
      'selectable': true,
      'formatter': columnFormatter
    }];

    /**
     * Slick grid table column definitions.
     * @type {!Array<*>}
     */
    this['shownConfig'] = [{
      'id': 'shown',
      'name': 'Shown',
      'field': 'name',
      'selectable': true,
      'formatter': columnFormatter
    }];

    this['hideDblClick'] = this['hide'].bind(this);
    this['showDblClick'] = this['show'].bind(this);

    /**
     * @type {!KeyHandler}
     * @private
     */
    this.keyHandler_ = new KeyHandler(getDocument());

    this.scope_.$on('$destroy', this.destroy_.bind(this));
    this.validate_();
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    dispose(this.keyHandler_);
    this.scope_ = null;
    this.element_ = null;
  }

  /**
   * Close the window
   *
   * @param {boolean} enableListen
   * @export
   */
  listenForKeys(enableListen) {
    if (enableListen) {
      this.keyHandler_.listen(KeyEvent.EventType.KEY, this.handleKeyEvent_, false, this);
    } else {
      this.keyHandler_.unlisten(KeyEvent.EventType.KEY, this.handleKeyEvent_, false, this);
    }
  }

  /**
   * Toggles columns to shown.
   *
   * @param {boolean=} opt_all Whether to select all
   * @export
   */
  show(opt_all) {
    if (opt_all === true) {
      for (var i = 0; i < this['hiddenColumns'].length; i++) {
        this['hiddenColumns'][i]['visible'] = true;
        this['shownColumns'].push(this['hiddenColumns'][i]);
      }
      this['hiddenColumns'].length = 0;

      this.scope_.$broadcast(SlickGridEvent.INVALIDATE_ROWS);
    } else if (this['hiddenSelected'].length > 0) {
      // sort them first so they appear in the same order in the Shown panel. slickgrid doesn't order the sorted array in
      // any particular fashion.
      this['hiddenSelected'].sort(numerateNameCompare);

      // shown columns will always be appended to the current list
      for (var i = 0; i < this['hiddenSelected'].length; i++) {
        var hidden = this['hiddenSelected'][i];
        hidden['visible'] = true;
        remove(this['hiddenColumns'], hidden);
        this['shownColumns'].push(hidden);
      }

      // set the columns as the selection in the shown panel.
      this['shownSelected'] = this['hiddenSelected'];
      this['hiddenSelected'] = [];

      // trigger a grid update then scroll the shown columns to the top of the view
      this.scope_.$broadcast(SlickGridEvent.INVALIDATE_ROWS);
      this.scope_.$broadcast(SlickGridEvent.SCROLL_TO, this['shownSelected'][0], true);
    }

    this.validate_();
    this.find(this['searchIndex'] - 1);
  }

  /**
   * Toggles columns to hidden.
   *
   * @param {boolean=} opt_all Whether to select all
   * @export
   */
  hide(opt_all) {
    if (opt_all === true) {
      for (var i = 0; i < this['shownColumns'].length; i++) {
        this['shownColumns'][i]['visible'] = false;
        this['hiddenColumns'].push(this['shownColumns'][i]);
      }
      this['shownColumns'].length = 0;
    } else if (this['shownSelected'].length > 0) {
      for (var i = 0; i < this['shownSelected'].length; i++) {
        var shown = this['shownSelected'][i];
        shown['visible'] = false;
        remove(this['shownColumns'], shown);
        this['hiddenColumns'].push(shown);
      }
    }

    this['hiddenColumns'].sort(numerateNameCompare);

    this.validate_();
    this.scope_.$broadcast(SlickGridEvent.INVALIDATE_ROWS);
    this.find(this['searchIndex'] - 1);
  }

  /**
   * Save the state
   *
   * @export
   */
  accept() {
    var srcColumns = this.scope_['columns'];
    var columns = this['shownColumns'];

    for (var i = 0; i < this['hiddenColumns'].length; i++) {
      var id = this['hiddenColumns'][i]['id'];
      if (this.sourceColumns_[id]) {
        this.sourceColumns_[id]['visible'] = false;
      }
    }

    for (var i = 0; i < this['shownColumns'].length; i++) {
      var id = this['shownColumns'][i]['id'];
      if (this.sourceColumns_[id]) {
        this.sourceColumns_[id]['visible'] = true;
      }
    }

    for (var i = 0, j = 0; i < columns.length; i++, j++) {
      while (j < srcColumns.length && !srcColumns[j]['visible']) {
        j++;
      }

      if (columns[i]['id'] != srcColumns[j]['id']) {
        // if the current visible source column isn't the same as the current grid column, that column moved in the
        // grid. move it in the source.
        var index = findIndex(srcColumns, findByField.bind(this, 'id', columns[i]['id']));
        if (index > -1) {
          var targetIndex = j > index ? j - 1 : j;
          moveItem(srcColumns, index, targetIndex);
        }
      }
    }

    if (this.scope_['acceptCallback']) {
      this.scope_['acceptCallback']();
    }

    if (this.scope_['shownCallback']) {
      this.scope_['shownCallback'](this['shownColumns']);
    }

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

  /**
   * Checks the overall form validity (i.e. at least 1 column is visible)
   *
   * @private
   */
  validate_() {
    this['valid'] = this['shownColumns'].length > 0;
  }

  /**
   * Generate row content in slick table
   *
   * @param {ColumnDefinition} column
   * @param {(ColumnDefinition|string)} col
   * @return {string} The value
   * @private
   */
  getColumnValue_(column, col) {
    return `<${columnRowUi} item="item"></${columnRowUi}>`;
  }

  /**
   * @param {string} term
   * @param {string} columnName
   * @return {Array<{col: ColumnDefinition, list: string}>}
   * @private
   */
  find_(term, columnName) {
    var items = [];
    if (term) {
      var text = term.trim().toUpperCase();
      if (this[columnName]) {
        for (var i = 0; i < this[columnName].length; i++) {
          if (this[columnName][i]['name'].toUpperCase().indexOf(text) > -1) {
            items.push({col: this[columnName][i], list: columnName});
          }
        }
      }
    }
    return items;
  }

  /**
   * Select the hidden terms
   *
   * @param {number=} opt_startIndex
   * @export
   */
  find(opt_startIndex) {
    if (this['term'] != '') {
      this['searchResults'] = this.find_(this['term'], 'hiddenColumns')
          .concat(this.find_(this['term'], 'shownColumns'));
      this['searchIndex'] = opt_startIndex != null ? opt_startIndex : -1;
      this.next();
    }
  }

  /**
   * Toggles columns to shown.
   *
   * @export
   */
  clear() {
    this['term'] = '';
    this['searchResults'] = [];
    this['searchIndex'] = 0;
  }

  /**
   * Toggles columns to shown.
   *
   * @export
   */
  next() {
    if (this['searchResults'].length > 0) {
      this['searchIndex'] = (this['searchIndex'] + 1) % this['searchResults'].length;
      this.updateSearch_();
    }
  }

  /**
   * Toggles columns to shown.
   *
   * @export
   */
  previous() {
    if (this['searchResults'].length > 0) {
      this['searchIndex'] = this['searchIndex'] == 0 ? this['searchResults'].length - 1 : this['searchIndex'] - 1;
      this.updateSearch_();
    }
  }

  /**
   * @private
   */
  updateSearch_() {
    var goTo = this['searchResults'][this['searchIndex']];
    if (goTo.list == 'hiddenColumns') {
      this['shownSelected'] = [];
      this['hiddenSelected'] = [goTo.col];
    } else {
      this['hiddenSelected'] = [];
      this['shownSelected'] = [goTo.col];
    }
    // trigger a grid update then scroll the columns the search result
    this.scope_.$broadcast(SlickGridEvent.INVALIDATE_ROWS);
    this.scope_.$broadcast(SlickGridEvent.SCROLL_TO, goTo.col, true);
  }

  /**
   * Handles key events
   *
   * @param {KeyEvent} event
   * @private
   */
  handleKeyEvent_(event) {
    if (event.keyCode === KeyCodes.ENTER) {
      event.preventDefault();
      event.stopPropagation();
      if (event.shiftKey) {
        this.previous();
      } else {
        this.next();
      }
    }
  }
}
