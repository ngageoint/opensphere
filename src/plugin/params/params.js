goog.declareModuleId('plugin.params');

import osActionEventType from '../../os/action/eventtype.js';
import * as osFile from '../../os/file/index.js';
import osImplements from '../../os/implements.js';
import ILayer from '../../os/layer/ilayer.js';
import * as osObject from '../../os/object/object.js';
import IUrlSource from '../../os/ol/source/iurlsource.js';
import RequestSource from '../../os/source/requestsource.js';
import * as osUrl from '../../os/url/url.js';

const QueryData = goog.require('goog.Uri.QueryData');
const {split: splitUrl} = goog.require('goog.uri.utils');
const ComponentIndex = goog.require('goog.uri.utils.ComponentIndex');


/**
 * Identifier for params plugin components.
 * @type {string}
 */
export const ID = 'params';

/**
 * Events for the params plugin.
 * @enum {string}
 */
export const EventType = {
  EDIT_PARAMS: 'params:edit'
};

/**
 * Metric keys for the params plugin.
 * @enum {string}
 */
export const Metrics = {
  EDIT_PARAMS: 'params.editParams'
};

/**
 * If a URI supports parameter modification.
 *
 * @param {!goog.Uri} uri The URI.
 * @return {boolean}
 */
export const isUriSupported = function(uri) {
  return uri.getScheme() !== osFile.FileScheme.FILE && uri.getScheme() !== osFile.FileScheme.LOCAL;
};

/**
 * Check if a layer supports request parameter overrides.
 *
 * @param {ol.layer.Layer} layer The layer.
 * @return {boolean} If the layer supports request parameter overrides.
 */
export const supportsParamOverrides = function(layer) {
  var source = layer.getSource();
  if (source instanceof RequestSource) {
    var request = source.getRequest();
    if (request) {
      var uri = request.getUri();
      return uri != null && isUriSupported(uri);
    }
  } else if (osImplements(layer, ILayer.ID) && osImplements(source, IUrlSource.ID)) {
    return true;
  }

  return false;
};

/**
 * Get the request parameters for a layer.
 *
 * @param {ol.layer.Layer} layer The layer.
 * @return {Object} The request parameters.
 */
export const getParamsFromLayer = function(layer) {
  var params = null;

  var source = layer.getSource();
  if (source instanceof RequestSource) {
    var request = source.getRequest();
    if (request) {
      var uri = request.getUri();
      if (uri && isUriSupported(uri)) {
        // copy the existing params onto the object
        params = osUrl.queryDataToObject(uri.getQueryData());
      }
    }
  } else if (osImplements(source, IUrlSource.ID)) {
    source = /** @type {IUrlSource} */ (source);

    var sourceParams = source.getParams();
    if (sourceParams) {
      params = osObject.unsafeClone(sourceParams);
    }
  }

  return params;
};

/**
 * Set the request parameters for a layer.
 *
 * @param {ol.layer.Layer} layer The layer.
 * @param {!Object} params The new parameters.
 * @param {Array<string>=} opt_remove Keys to remove.
 */
export const setParamsForLayer = function(layer, params, opt_remove) {
  var source = layer.getSource();
  if (source instanceof RequestSource) {
    var request = source.getRequest();
    if (request) {
      var uri = request.getUri();
      if (uri && isUriSupported(uri)) {
        var qd = uri.getQueryData();
        if (!qd) {
          qd = new QueryData();
          uri.setQueryData(qd);
        }

        for (var key in params) {
          qd.set(key, params[key]);
        }

        if (opt_remove) {
          opt_remove.forEach(function(key) {
            qd.remove(key);
          });
        }

        source.refresh();
      }
    }
  } else if (osImplements(source, IUrlSource.ID)) {
    source = /** @type {IUrlSource} */ (source);

    var oldParams = source.getParams();
    if (oldParams) {
      Object.assign(oldParams, params);

      if (opt_remove) {
        opt_remove.forEach(function(key) {
          delete oldParams[key];
        });
      }

      source.updateParams(oldParams);
    }
  }
};

/**
 * Get the request URL(s) for a layer.
 *
 * @param {ol.layer.Layer} layer The layer.
 * @return {Array<string>|string|null} An array if multiple URL's are supported, string for single-URL sources,
 *                                     null if the URL could not be resolved.
 */
export const getUrlsForLayer = function(layer) {
  var urls = null;

  if (layer) {
    var source = layer.getSource();
    if (source instanceof RequestSource) {
      var request = source.getRequest();
      if (request) {
        var uri = request.getUri();
        if (uri) {
          urls = uri.toString().replace(/\?.*/, '') || null;
        }
      }
    } else if (osImplements(source, IUrlSource.ID)) {
      source = /** @type {IUrlSource} */ (source);

      var sourceUrls = source.getUrls();
      if (sourceUrls) {
        urls = sourceUrls.slice();
      }
    }
  }

  return urls;
};

/**
 * Set the request URL(s) for a layer.
 *
 * @param {ol.layer.Layer} layer The layer.
 * @param {!(Array<string>|string)} urls The URL's.
 */
export const setUrlsForLayer = function(layer, urls) {
  if (layer) {
    var source = layer.getSource();
    if (source instanceof RequestSource) {
      var url = typeof urls == 'string' ? urls : urls[0];
      var request = source.getRequest();
      if (request) {
        var uri = request.getUri();
        if (uri) {
          var m = splitUrl(String(url));
          uri.setScheme(m[ComponentIndex.SCHEME] || '', true);
          uri.setUserInfo(m[ComponentIndex.USER_INFO] || '', true);
          uri.setDomain(m[ComponentIndex.DOMAIN] || '', true);
          uri.setPort(m[ComponentIndex.PORT]);
          uri.setPath(m[ComponentIndex.PATH] || '', true);

          source.refresh();
        }
      }
    } else if (osImplements(source, IUrlSource.ID)) {
      source = /** @type {IUrlSource} */ (source);

      if (urls) {
        if (typeof urls == 'string') {
          source.setUrl(urls);
        } else if (urls.length > 0) {
          source.setUrls(urls);
        }
      }

      if (osImplements(layer, ILayer.ID)) {
        /** @type {!os.layer.ILayer} */ (layer).callAction(osActionEventType.REFRESH);
      }
    }
  }
};
