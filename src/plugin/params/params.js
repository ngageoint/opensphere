goog.provide('plugin.params');

goog.require('goog.Uri.QueryData');
goog.require('goog.uri.utils');
goog.require('os.action.EventType');
goog.require('os.file.File');
goog.require('os.object');
goog.require('os.ol.source.IUrlSource');
goog.require('os.source.Request');
goog.require('os.url');


/**
 * Identifier for params plugin components.
 * @type {string}
 * @const
 */
plugin.params.ID = 'params';


/**
 * Events for the params plugin.
 * @enum {string}
 */
plugin.params.EventType = {
  EDIT_PARAMS: 'params:edit'
};


/**
 * Metric keys for the params plugin.
 * @enum {string}
 */
plugin.params.Metrics = {
  EDIT_PARAMS: 'params.editParams'
};


/**
 * If a URI supports parameter modification.
 * @param {!goog.Uri} uri The URI.
 * @return {boolean}
 */
plugin.params.isUriSupported = function(uri) {
  return uri.getScheme() !== os.file.FileScheme.FILE && uri.getScheme() !== os.file.FileScheme.LOCAL;
};


/**
 * Check if a layer supports request parameter overrides.
 * @param {ol.layer.Layer} layer The layer.
 * @return {boolean} If the layer supports request parameter overrides.
 */
plugin.params.supportsParamOverrides = function(layer) {
  var source = layer.getSource();
  if (source instanceof os.source.Request) {
    var request = source.getRequest();
    if (request) {
      var uri = request.getUri();
      return uri != null && plugin.params.isUriSupported(uri);
    }
  } else if (os.implements(layer, os.layer.ILayer.ID) && os.implements(source, os.ol.source.IUrlSource.ID)) {
    return true;
  }

  return false;
};


/**
 * Get the request parameters for a layer.
 * @param {ol.layer.Layer} layer The layer.
 * @return {Object} The request parameters.
 */
plugin.params.getParamsFromLayer = function(layer) {
  var params = null;

  var source = layer.getSource();
  if (source instanceof os.source.Request) {
    var request = source.getRequest();
    if (request) {
      var uri = request.getUri();
      if (uri && plugin.params.isUriSupported(uri)) {
        // copy the existing params onto the object
        params = os.url.queryDataToObject(uri.getQueryData());
      }
    }
  } else if (os.implements(source, os.ol.source.IUrlSource.ID)) {
    source = /** @type {os.ol.source.IUrlSource} */ (source);

    var sourceParams = source.getParams();
    if (sourceParams) {
      params = os.object.unsafeClone(sourceParams);
    }
  }

  return params;
};


/**
 * Set the request parameters for a layer.
 * @param {ol.layer.Layer} layer The layer.
 * @param {!Object} params The new parameters.
 * @param {Array<string>=} opt_remove Keys to remove.
 */
plugin.params.setParamsForLayer = function(layer, params, opt_remove) {
  var source = layer.getSource();
  if (source instanceof os.source.Request) {
    var request = source.getRequest();
    if (request) {
      var uri = request.getUri();
      if (uri && plugin.params.isUriSupported(uri)) {
        var qd = uri.getQueryData();
        if (!qd) {
          qd = new goog.Uri.QueryData();
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
  } else if (os.implements(source, os.ol.source.IUrlSource.ID)) {
    source = /** @type {os.ol.source.IUrlSource} */ (source);

    var oldParams = source.getParams();
    if (oldParams) {
      goog.object.extend(oldParams, params);

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
 * @param {ol.layer.Layer} layer The layer.
 * @return {Array<string>|string|null} An array if multiple URL's are supported, string for single-URL sources,
 *                                     null if the URL could not be resolved.
 */
plugin.params.getUrlsForLayer = function(layer) {
  var urls = null;

  if (layer) {
    var source = layer.getSource();
    if (source instanceof os.source.Request) {
      var request = source.getRequest();
      if (request) {
        var uri = request.getUri();
        if (uri) {
          urls = uri.toString().replace(/\?.*/, '') || null;
        }
      }
    } else if (os.implements(source, os.ol.source.IUrlSource.ID)) {
      source = /** @type {os.ol.source.IUrlSource} */ (source);

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
 * @param {ol.layer.Layer} layer The layer.
 * @param {!(Array<string>|string)} urls The URL's.
 */
plugin.params.setUrlsForLayer = function(layer, urls) {
  if (layer) {
    var source = layer.getSource();
    if (source instanceof os.source.Request) {
      var url = typeof urls == 'string' ? urls : urls[0];
      var request = source.getRequest();
      if (request) {
        var uri = request.getUri();
        if (uri) {
          var m = goog.uri.utils.split(String(url));
          uri.setScheme(m[goog.uri.utils.ComponentIndex.SCHEME] || '', true);
          uri.setUserInfo(m[goog.uri.utils.ComponentIndex.USER_INFO] || '', true);
          uri.setDomain(m[goog.uri.utils.ComponentIndex.DOMAIN] || '', true);
          uri.setPort(m[goog.uri.utils.ComponentIndex.PORT]);
          uri.setPath(m[goog.uri.utils.ComponentIndex.PATH] || '', true);

          source.refresh();
        }
      }
    } else if (os.implements(source, os.ol.source.IUrlSource.ID)) {
      source = /** @type {os.ol.source.IUrlSource} */ (source);

      if (urls) {
        if (typeof urls == 'string') {
          source.setUrl(urls);
        } else if (urls.length > 0) {
          source.setUrls(urls);
        }
      }

      if (os.implements(layer, os.layer.ILayer.ID)) {
        /** @type {!os.layer.ILayer} */ (layer).callAction(os.action.EventType.REFRESH);
      }
    }
  }
};
