goog.provide('os.ui.column.ColumnManagerCtrl');
goog.provide('os.ui.column.columnManagerDirective');

goog.require('goog.events.KeyHandler');
goog.require('goog.string');
goog.require('os.ui.Module');
goog.require('os.ui.column.columnRowDirective');
goog.require('os.ui.slick.column');


/**
 * The columnManager directive
 * @return {angular.Directive}
 */
os.ui.column.columnManagerDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'columns': '=',
      'acceptCallback': '=',
      'shownCallback': '='
    },
    templateUrl: os.ROOT + 'views/column/columnmanager.html',
    controller: os.ui.column.ColumnManagerCtrl,
    controllerAs: 'columnManager'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('columnManager', [os.ui.column.columnManagerDirective]);



/**
 * Controller function for the columnManager directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.column.ColumnManagerCtrl = function($scope, $element) {
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
   * @type {Object.<string, os.data.ColumnDefinition>}
   * @private
   */
  this.sourceColumns_ = {};

  /**
   * @type {Array.<os.data.ColumnDefinition>}
   */
  this['shownColumns'] = [];

  /**
   * @type {?Array.<os.data.ColumnDefinition>}
   */
  this['shownSelected'] = [];

  /**
   * @type {Array.<os.data.ColumnDefinition>}
   */
  this['hiddenColumns'] = [];

  /**
   * @type {?Array.<os.data.ColumnDefinition>}
   */
  this['hiddenSelected'] = [];

  /**
   * @type {Array.<{col: os.data.ColumnDefinition, list: string}>}
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

  this['hiddenColumns'].sort(os.ui.slick.column.numerateNameCompare);

  /**
   * Slick grid table options
   * @type {Object.<string, *>}
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
   * @type {!Array.<*>}
   */
  this['hiddenConfig'] = [{
    'id': 'hidden',
    'name': 'Hidden',
    'field': 'name',
    'selectable': true,
    'formatter': os.ui.slick.formatter.columnFormatter
  }];

  /**
   * Slick grid table column definitions.
   * @type {!Array.<*>}
   */
  this['shownConfig'] = [{
    'id': 'shown',
    'name': 'Shown',
    'field': 'name',
    'selectable': true,
    'formatter': os.ui.slick.formatter.columnFormatter
  }];

  this['hideDblClick'] = this['hide'].bind(this);
  this['showDblClick'] = this['show'].bind(this);

  /**
   * @type {!goog.events.KeyHandler}
   * @private
   */
  this.keyHandler_ = new goog.events.KeyHandler(goog.dom.getDocument());

  this.scope_.$on('$destroy', this.destroy_.bind(this));
  this.validate_();
};


/**
 * Clean up.
 * @private
 */
os.ui.column.ColumnManagerCtrl.prototype.destroy_ = function() {
  goog.dispose(this.keyHandler_);
  this.scope_ = null;
  this.element_ = null;
};


/**
 * Close the window
 * @param {boolean} enableListen
 */
os.ui.column.ColumnManagerCtrl.prototype.listenForKeys = function(enableListen) {
  if (enableListen) {
    this.keyHandler_.listen(goog.events.KeyHandler.EventType.KEY, this.handleKeyEvent_, false, this);
  } else {
    this.keyHandler_.unlisten(goog.events.KeyHandler.EventType.KEY, this.handleKeyEvent_, false, this);
  }
};
goog.exportProperty(
    os.ui.column.ColumnManagerCtrl.prototype,
    'listenForKeys',
    os.ui.column.ColumnManagerCtrl.prototype.listenForKeys);


/**
 * Toggles columns to shown.
 * @param {boolean=} opt_all Whether to select all
 */
os.ui.column.ColumnManagerCtrl.prototype.show = function(opt_all) {
  if (opt_all === true) {
    for (var i = 0; i < this['hiddenColumns'].length; i++) {
      this['hiddenColumns'][i]['visible'] = true;
      this['shownColumns'].push(this['hiddenColumns'][i]);
    }
    this['hiddenColumns'].length = 0;

    this.scope_.$broadcast(os.ui.slick.SlickGridEvent.INVALIDATE_ROWS);
  } else if (this['hiddenSelected'].length > 0) {
    // sort them first so they appear in the same order in the Shown panel. slickgrid doesn't order the sorted array in
    // any particular fashion.
    this['hiddenSelected'].sort(os.ui.slick.column.numerateNameCompare);

    // shown columns will always be appended to the current list
    for (var i = 0; i < this['hiddenSelected'].length; i++) {
      var hidden = this['hiddenSelected'][i];
      hidden['visible'] = true;
      goog.array.remove(this['hiddenColumns'], hidden);
      this['shownColumns'].push(hidden);
    }

    // set the columns as the selection in the shown panel.
    this['shownSelected'] = this['hiddenSelected'];
    this['hiddenSelected'] = [];

    // trigger a grid update then scroll the shown columns to the top of the view
    this.scope_.$broadcast(os.ui.slick.SlickGridEvent.INVALIDATE_ROWS);
    this.scope_.$broadcast(os.ui.slick.SlickGridEvent.SCROLL_TO, this['shownSelected'][0], true);
  }

  this.validate_();
  this.find(this['searchIndex'] - 1);
};
goog.exportProperty(
    os.ui.column.ColumnManagerCtrl.prototype,
    'show',
    os.ui.column.ColumnManagerCtrl.prototype.show);


/**
 * Toggles columns to hidden.
 * @param {boolean=} opt_all Whether to select all
 */
os.ui.column.ColumnManagerCtrl.prototype.hide = function(opt_all) {
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
      goog.array.remove(this['shownColumns'], shown);
      this['hiddenColumns'].push(shown);
    }
  }

  this['hiddenColumns'].sort(os.ui.slick.column.numerateNameCompare);

  this.validate_();
  this.scope_.$broadcast(os.ui.slick.SlickGridEvent.INVALIDATE_ROWS);
  this.find(this['searchIndex'] - 1);
};
goog.exportProperty(
    os.ui.column.ColumnManagerCtrl.prototype,
    'hide',
    os.ui.column.ColumnManagerCtrl.prototype.hide);


/**
 * Save the state
 */
os.ui.column.ColumnManagerCtrl.prototype.accept = function() {
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
      var index = goog.array.findIndex(srcColumns,
          os.ui.slick.column.findByField.bind(this, 'id', columns[i]['id']));
      if (index > -1) {
        var targetIndex = j > index ? j - 1 : j;
        goog.array.moveItem(srcColumns, index, targetIndex);
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
};
goog.exportProperty(
    os.ui.column.ColumnManagerCtrl.prototype,
    'accept',
    os.ui.column.ColumnManagerCtrl.prototype.accept);


/**
 * Close the window
 */
os.ui.column.ColumnManagerCtrl.prototype.close = function() {
  os.ui.window.close(this.element_);
};
goog.exportProperty(
    os.ui.column.ColumnManagerCtrl.prototype,
    'close',
    os.ui.column.ColumnManagerCtrl.prototype.close);


/**
 * Checks the overall form validity (i.e. at least 1 column is visible)
 * @private
 */
os.ui.column.ColumnManagerCtrl.prototype.validate_ = function() {
  this['valid'] = this['shownColumns'].length > 0;
};


/**
 * Generate row content in slick table
 * @param {os.data.ColumnDefinition} column
 * @param {(os.data.ColumnDefinition|string)} col
 * @return {string} The value
 * @private
 */
os.ui.column.ColumnManagerCtrl.prototype.getColumnValue_ = function(column, col) {
  return '<columnrow item="item"></columnrow>';
};


/**
 * @param {string} term
 * @param {string} columnName
 * @return {Array.<{col: os.data.ColumnDefinition, list: string}>}
 * @private
 */
os.ui.column.ColumnManagerCtrl.prototype.find_ = function(term, columnName) {
  var items = [];
  if (term) {
    var text = goog.string.trim(term).toUpperCase();
    if (this[columnName]) {
      for (var i = 0; i < this[columnName].length; i++) {
        if (this[columnName][i]['name'].toUpperCase().indexOf(text) > -1) {
          items.push({col: this[columnName][i], list: columnName});
        }
      }
    }
  }
  return items;
};


/**
 * Select the hidden terms
 * @param {number=} opt_startIndex
 */
os.ui.column.ColumnManagerCtrl.prototype.find = function(opt_startIndex) {
  if (this['term'] != '') {
    this['searchResults'] = this.find_(this['term'], 'hiddenColumns').concat(this.find_(this['term'], 'shownColumns'));
    this['searchIndex'] = goog.isDefAndNotNull(opt_startIndex) ? opt_startIndex : -1;
    this.next();
  }
};
goog.exportProperty(
    os.ui.column.ColumnManagerCtrl.prototype,
    'find',
    os.ui.column.ColumnManagerCtrl.prototype.find);


/**
 * Toggles columns to shown.
 */
os.ui.column.ColumnManagerCtrl.prototype.clear = function() {
  this['term'] = '';
  this['searchResults'] = [];
  this['searchIndex'] = 0;
};
goog.exportProperty(
    os.ui.column.ColumnManagerCtrl.prototype,
    'clear',
    os.ui.column.ColumnManagerCtrl.prototype.clear);


/**
 * Toggles columns to shown.
 */
os.ui.column.ColumnManagerCtrl.prototype.next = function() {
  if (this['searchResults'].length > 0) {
    this['searchIndex'] = (this['searchIndex'] + 1) % this['searchResults'].length;
    this.updateSearch_();
  }
};
goog.exportProperty(
    os.ui.column.ColumnManagerCtrl.prototype,
    'next',
    os.ui.column.ColumnManagerCtrl.prototype.next);


/**
 * Toggles columns to shown.
 */
os.ui.column.ColumnManagerCtrl.prototype.previous = function() {
  if (this['searchResults'].length > 0) {
    this['searchIndex'] = this['searchIndex'] == 0 ? this['searchResults'].length - 1 : this['searchIndex'] - 1;
    this.updateSearch_();
  }
};
goog.exportProperty(
    os.ui.column.ColumnManagerCtrl.prototype,
    'previous',
    os.ui.column.ColumnManagerCtrl.prototype.previous);


/**
 * @private
 */
os.ui.column.ColumnManagerCtrl.prototype.updateSearch_ = function() {
  var goTo = this['searchResults'][this['searchIndex']];
  if (goTo.list == 'hiddenColumns') {
    this['shownSelected'] = [];
    this['hiddenSelected'] = [goTo.col];
  } else {
    this['hiddenSelected'] = [];
    this['shownSelected'] = [goTo.col];
  }
  // trigger a grid update then scroll the columns the search result
  this.scope_.$broadcast(os.ui.slick.SlickGridEvent.INVALIDATE_ROWS);
  this.scope_.$broadcast(os.ui.slick.SlickGridEvent.SCROLL_TO, goTo.col, true);
};


/**
 * Handles key events
 * @param {goog.events.KeyEvent} event
 * @private
 */
os.ui.column.ColumnManagerCtrl.prototype.handleKeyEvent_ = function(event) {
  if (event.keyCode === goog.events.KeyCodes.ENTER) {
    event.preventDefault();
    event.stopPropagation();
    if (event.shiftKey) {
      this.previous();
    } else {
      this.next();
    }
  }
};


/**
 * Launches a column manager window with the given columns
 * @param {Array.<os.data.ColumnDefinition>} columns
 * @param {Function} callback
 */
os.ui.column.launchColumnManager = function(columns, callback) {
  var scopeOptions = {
    'columns': columns,
    'acceptCallback': callback
  };

  var windowOptions = {
    'label': 'Column Manager',
    'icon': 'fa fa-columns',
    'x': 'center',
    'y': 'center',
    'width': '600',
    'min-width': '500',
    'max-width': '700',
    'height': '400',
    'min-height': '350',
    'max-height': '1000',
    'show-close': true,
    'no-scroll': true,
    'modal': true
  };

  var template = '<column-manager columns="columns" accept-callback="acceptCallback" ></column-manager>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};


/**
 * Launches a column manager window with the given columns
 * @param {Array.<os.data.ColumnDefinition>} columns
 * @param {string} header Dialog header
 * @param {Function} callback
 */
os.ui.column.launchColumnManagerWithShownCallback = function(columns, header, callback) {
  var scopeOptions = {
    'columns': columns,
    'shownCallback': callback
  };

  var windowOptions = {
    'label': header,
    'icon': 'fa fa-columns',
    'x': 'center',
    'y': 'center',
    'width': '600',
    'min-width': '500',
    'max-width': '700',
    'height': '400',
    'min-height': '350',
    'max-height': '1000',
    'show-close': true,
    'no-scroll': true,
    'modal': true
  };

  var template = '<column-manager columns="columns" shown-callback="shownCallback"></column-manager>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
