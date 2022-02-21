goog.declareModuleId('plugin.ogc.ui.OgcServerImportUI');

import '../../../os/ui/singleurlform.js';
import * as ogc from '../../../os/ogc/ogc.js';
import * as os from '../../../os/os.js';
import Module from '../../../os/ui/module.js';
import OGCServer from '../../../os/ui/ogc/ogcserver.js';
import ProviderImportCtrl from '../../../os/ui/providerimport.js';
import * as OgcServerHelpUI from './ogcserverhelp.js';

const xml = goog.require('goog.dom.xml');

/**
 * The ogcserver import directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: os.ROOT + 'views/plugin/ogc/ui/ogcserverimport.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'ogcserver';


/**
 * Add the directive to the module
 */
Module.directive('ogcserver', [directive]);


/**
 * Controller for the ogcserver import dialog
 * @unrestricted
 */
export class Controller extends ProviderImportCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
    this['helpUi'] = OgcServerHelpUI.directiveTag;

    $scope['typeName'] = 'OGC Server';

    $scope['config']['type'] = 'ogc';
    var file = /** @type {OSFile} */ ($scope['config']['file']);

    if (file) {
      var content = file.getContent();
      var url = file.getUrl();

      if (content && typeof content === 'string') {
        var titles = content.match(/title>([^<]*)<\//i);

        if (titles && titles.length > 1) {
          $scope['config']['label'] = titles[1];
        }

        try {
          const doc = xml.loadXml(content);
          if (doc && doc.firstElementChild) {
            const rootNodeName = doc.firstElementChild.nodeName;

            if (ogc.GetCapsRootRegexp.WMS.test(rootNodeName) || /wms/i.test(url)) {
              $scope['config']['wms'] = url;
            } else if (ogc.GetCapsRootRegexp.WMTS.test(rootNodeName) || /wmts/i.test(url)) {
              $scope['config']['wmts'] = url;
            } else if (ogc.GetCapsRootRegexp.WFS.test(rootNodeName) || /wfs/i.test(url)) {
              $scope['config']['wfs'] = url;
            }
          }
        } catch (e) {

        }
      }
    } else if (this.dp) {
      const ogcServer = /** @type {OGCServer} */ (this.dp);
      $scope['config']['label'] = ogcServer.getLabel();

      $scope['config']['wms'] = ogcServer.getWmsUrl();
      $scope['config']['wmts'] = ogcServer.getWmtsUrl();
      $scope['config']['wfs'] = ogcServer.getWfsUrl();
    }

    // focus the form
    this.element.find('input[name="title"]').focus();
  }

  /**
   * @inheritDoc
   */
  getDataProvider() {
    var dp = this.dp || new OGCServer();
    dp.configure(this.scope['config']);
    return dp;
  }

  /**
   * @return {string}
   */
  getWmtsUrl() {
    return this.dp ? /** @type {OGCServer} */ (this.dp).getOriginalWmtsUrl() : '';
  }

  /**
   * @return {string}
   */
  getWmsUrl() {
    return this.dp ? /** @type {OGCServer} */ (this.dp).getOriginalWmsUrl() : '';
  }

  /**
   * @return {string}
   */
  getWfsUrl() {
    return this.dp ? /** @type {OGCServer} */ (this.dp).getOriginalWfsUrl() : '';
  }

  /**
   * @inheritDoc
   */
  getConfig() {
    var conf = {};
    var fields = ['label', 'enabled', 'type', 'wms', 'wmts', 'wfs'];
    var original = this.scope['config'];

    for (var key in original) {
      if (fields.indexOf(key) > -1) {
        conf[key] = original[key];
      }
    }

    return conf;
  }

  /**
   * @inheritDoc
   */
  formDiff() {
    // If any of the urls change, re-test
    return this.getWmtsUrl() !== this.scope['config']['wmts'] ||
        this.getWmsUrl() !== this.scope['config']['wms'] ||
        this.getWfsUrl() !== this.scope['config']['wfs'];
  }

  /**
   * @inheritDoc
   */
  saveAndClose() {
    const ogcServer = /** @type {OGCServer} */ (this.dp);
    ogcServer.setLabel(this.scope['config']['label']);
    ogcServer.setWmtsUrl(this.scope['config']['wmts']);
    ogcServer.setWmsUrl(this.scope['config']['wms']);
    ogcServer.setWfsUrl(this.scope['config']['wfs']);
    ogcServer.setOriginalWmtsUrl(this.scope['config']['wmts']);
    ogcServer.setOriginalWmsUrl(this.scope['config']['wms']);
    ogcServer.setOriginalWfsUrl(this.scope['config']['wfs']);
    super.saveAndClose();
  }
}
