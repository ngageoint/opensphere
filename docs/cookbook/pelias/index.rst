Pelias Search (Forward geocoding)
=================================

Problem
-------

You'd like to use the `Pelias geocoder <https://github.com/pelias/pelias>`_ (or an equivalent online service, like `geocode.earth <https://geocode.earth/>`_).

This was previously also known as Mapzen Search, although those services are end-of-life.


Solution
--------

Add suitable config settings for the service you want to enable. 

The base application includes the Pelias plugin, but it is disabled until configured. The following code shows how to change the config settings for Pelias from geocode.earth, where your API key goes in place of the REPLACE_THIS part of the :code:`url`:

.. code-block:: json
  :caption: ``config/settings.json``

  {
    "admin": {
      "plugin": {
        "pelias": {
          "geocoder": {
            "url": "https://api.geocode.earth/v1/search?api_key=REPLACE_THIS&text={s}",
            "extentParams": true,
            "extentThreshold": 300000,
            "focusPoint": true,
            "focusPointMinZoom": 5.0
          }
        }
      }
    }
  }


.. note:: The rest of the :code:`admin` settings, and the :code:`user` settings, are not shown to make it easier to see. If you're using a standard config file, the :code:`plugin` part is at the same level (peer item) to the :code:`about` settings.

Discussion
----------

If you have a local service, you do not need to provide an API key. For example, if your instance is running on localhost:3100 (standard for Pelias development installs), your :code:`url` would likely be :code:`http://localhost:3100/v1/search?text={s}`.

The :code:`extentParams` and :code:`extentThreshold` parts are optional, and change the search URL sent to the Pelias service. :code:`extentParams` enables (set false or leave out to disable) a rectangular boundary constraint on the search that corresponds to the map window, which is applied when the map extent is smaller (in metres) than the :code:`extentThreshold` (or 200km if not specified). The user effect is that searches only include results that would appear on the map.

Similarly, the :code:`focusPoint` and :code:`focusPointMinZoom` parts are optional. :code:`focusPoint` enables (set false or leave out to disable) a hint towards results that are close to the centre of the map. It only takes effect if the map is zoomed in to at least the :code:`focusPointMinZoom` value (or 4.0 if not specified). Unlike the extent values that make a hard constraint, this is a hint on prioritisation, and results from long distances away may also be provided.

If you do need to use an API key, but don't want to expose it to every user, a reverse proxy server to add the API key to the query may be useful. One option is to the Apache mod_proxy and mod_rewrite capabilities. A typical configuration might look like:


.. code-block:: apache

  SSLProxyEngine On
  SSLProxyCheckPeerCN on
  SSLProxyCheckPeerExpire on

  RewriteEngine  on
  RewriteRule ^/v1/search https://api.geocode.earth/v1/search?api_key=REPLACE_THIS [QSA,P]
  ProxyPassReverse "/v1/search" "https://api.geocode.earth/v1/search"

Note your API key goes in place of the REPLACE_THIS part of the :code:`RewriteRule`. This will also need some modules to be loaded (if not already in place): proxy, proxy_http, rewrite and ssl.  You can now use a :code:`url` of something like :code:`https://MY_SERVER/v1/search?text={s}` (or :code:`http://MY_SERVER/v1/search?text={s}` if your server is not configured for HTTPS, which you probably should consider fixing) where the MY_SERVER part is replaced with your reverse proxy server hostname or IP address.

You should also consider the extent to which you need to secure your reverse proxy server. Consult the applicable server documentation for authentication options for your deployment scenario.
