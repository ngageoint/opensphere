goog.declareModuleId('os.ui.ogc.OGCListUI');

import Settings from '../../config/settings.js';
import * as registry from '../../ogc/registry.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';
import {apply} from '../ui.js';

const GoogPromise = goog.requireType('goog.Promise');
const {default: OGCService} = goog.requireType('os.ogc.OGCService');


/**
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: {
    'value': '=',
    'isRequired': '=?',
    'service': '@?',
    'provideDefault': '=?',
    'defaultValueSetting': '=?',
    'filter': '=?',
    'error': '=?',
    'multi': '='
  },
  templateUrl: ROOT + 'views/ogc/ogclist.html',
  controller: Controller,
  controllerAs: 'ogcCtrl'
});


/**
 * Register the directive.
 */
Module.directive('ogclist', [directive]);



/**
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @ngInject
   * @param {angular.Scope} $scope
   * @param {angular.JQLite} $element
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
     * @type {?OGCService}
     * @private
     */
    this.service_;

    /**
     * @type {?GoogPromise}
     */
    this.allPromise;

    /**
     * In the angular 'ogcCtrl' scope
     * @type {boolean}
     */
    this['loading'] = true;

    /**
     * In the angular 'ogcCtrl' scope
     * @type {Array<Feature>}
     */
    this['items'] = [];

    /**
     * In the angular 'ogcCtrl' scope
     * The response object
     */
    this['response'] = null;


    this.scope_['isRequired'] = this.scope_['isRequired'] != null ? this.scope_['isRequired'] : false;
    this.scope_['error'] = this.scope_['error'] != null ? this.scope_['error'] : false;
    this.scope_['service'] = this.scope_['service'] != null ? this.scope_['service'] : 'water';
    this.scope_['provideDefault'] = this.scope_['provideDefault'] || false;

    this.service_ = registry.getInstance().get(this.scope_['service']);
    if (this.service_ && !this.service_.isConfigured()) {
      this.service_ = null;
    } else {
      this.allPromise = this.service_.getAll();
      this.allPromise.then(this.prepareField, () => {}, this);
    }

    $scope.$on(Controller.BULK_CHOSEN, function(event, val) {
      // value was updated by the bulk-edit-mulival directive, re-init select2
      if (!this['loading']) {
        this.scope_['value'] = val;
        this.prepareField(this['response']);
      }
    }.bind(this));
    $scope.$on('$destroy', this.destroy.bind(this));
  }

  /**
   * Clean up angular objects
   */
  destroy() {
    this.scope_ = null;
    this.element_ = null;
    if (this.allPromise) {
      this.allPromise.cancel();
    }
  }

  /**
   * Prepares the data field. Looks at the values passed in on the scope to try to match it to known
   * values. If it succeeds, the select2 will be initialized to those values.
   * @param {Array<Feature>} data
   */
  prepareField(data) {
    if (!this.service_) return;

    this['response'] = data;

    var selectData = [];
    var selectInitItems = [];
    var values = this.scope_['value'];
    this['items'] = this.scope_['filter'] ? data.filter(this.scope_['filter']) : data;
    this['loading'] = false;

    this['items'].forEach((item) => {
      var id = this.service_.getId(item);
      var text = this.service_.getLabel(item);
      var selectItem = {
        'id': id,
        'text': text
      };
      selectData.push(selectItem);
    });

    if (values != null) {
      values.forEach((item) => {
        if (item != null) {
          var id = this.service_.getId(item);
          var this_ = this;
          var match = this['items'].find(function(item) {
            return this_.service_.getId(item) == id;
          });

          if (match) {
            var matchId = this.service_.getId(item);
            var matchText = this.service_.getLabel(item);
            var selectItem = {
              'id': matchId,
              'text': matchText
            };

            selectInitItems.push(selectItem);
          }
        }
      });
    } else if (this.scope_['provideDefault'] == true) {
      var selectItem = Settings.getInstance().get(this.scope_['defaultValueSetting']); // TODO
      selectInitItems.push(selectItem);
    }

    this.element_.find('.js-ogc-typeahead').select2({ // TODO
      'data': selectData,
      'multiple': this.scope_['multi'],
      'placeholder': 'Select...',
      'separator': '|',
      'initSelection': (el, callback) => {
        // only callback with the array if we are in multi-picker mode
        callback(this.scope_['multi'] ? selectInitItems : selectInitItems[0]);
        var items = [];
        if (selectInitItems.length > 0) {
          this.scope_['value'] = [];
        }
        selectInitItems.forEach((selectedItem) => {
          var item = this.getById(selectedItem['id']);
          if (item) {
            items.push(item);
            this.scope_['value'].push(item);
          }
        });
        this.scope_.$emit(Controller.CHOSEN, items);
      }
    }).select2('val', selectInitItems)
        .on('change', this.onChange.bind(this));

    apply(this.scope_);
  }

  /**
   * Gets a Feature by id.
   * @param {string} id
   * @return {Feature}
   */
  getById(id) {
    if (!this.service_) return null;

    return this['items'].find((item) => {
      return this.service_.getId(item) == id;
    }, this);
  }

  /**
   * Callback for selection changes in the select2.
   * @param {Object} event The select2 change event
   */
  onChange(event) {
    if (this.scope_) {
      this.scope_['value'] = [];
      if (event['val'] instanceof Array) {
        for (var i = 0; i < event['val'].length; i++) {
          this.scope_['value'].push(this.getById(event['val'][i]));
        }
      } else {
        this.scope_['value'].push(this.getById(event['val']));
      }
      this.scope_.$emit(Controller.CHOSEN, this.scope_['value']);
      this.scope_['ogcListForm'].$setDirty();
      apply(this.scope_);
    }
  }
}


/**
 * @type {string}
 */
Controller.CHOSEN = 'dataChosen';


/**
 * @type {string}
 */
Controller.BULK_CHOSEN = 'bulkDataChosen';


/**
 * @typedef {{
 *  label: (string|undefined),
 *  text: (string|undefined),
 *  icon: (string|undefined)
 * }}
 */
export let Options;
