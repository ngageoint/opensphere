Settings Guide
##############

OpenSphere's base settings live in ``config/settings.json``. Unfortunately, JSON does not allow comments.

Basics
======
The entire settings tree falls under two categories:

.. code-block:: none

  {
    "admin": {
      ...
    },
    "user": {
      ...
    }
  }


admin
-----
Anything from ``admin`` is loaded "fresh" (but still follows browser caching directives) every time the application starts. The vast majority of all config goes here.

user
----
The ``user`` section is for specifying defaults for values that the user can otherwise permanently change in their settings. Developers can specify defaults in code:

.. code-block:: javascript

  // the second argument is essentially the application default
  var bgColor = /** @type {string} */ (os.settings.get('bgColor', 'black'));

That value may never actually show up in ``config/settings.json``, but sysadmins can change the default by placing a value like so:

.. code-block:: json

  {
    "user": {
      "bgColor": "white"
    }
  }

Assuming the user has a GUI to change that value, they can still change it to whatever they like, but the default will now be ``"white"``.

Merging
=======

When OpenSphere is built, ``settings.json`` files from all over are merged into one final file which is placed in ``opensphere/dist/opensphere/config/settings.json``. Take the following workspace example:

.. code-block:: none

  workspace/
    opensphere/
    opensphere-config-deployment-base/
    opensphere-config-deployment-specific/
    opensphere-plugin-x/
    opensphere-plugin-y/

By default, the merge order of the configs is defined in the order in which they are resolved. For the example above, this naturally results in the following merge order:

.. code-block:: javascript

  [
    // our base build project
    "opensphere",

    // plugins are resolved next
    "opensphere-plugin-x",
    "opensphere-plugin-y",

    // followed by config last
    "opensphere-config-deployment-base",
    "opensphere-config-deployment-specific"
  ]

You can see the merge order in ``.build/settings-debug.json``, which is what the debug build output uses to load the files in the proper order.

If this order is not satisfactory, each project can define its own merge priority in ``package.json:build.priority``.

Merge Values
============
The merge in the build is performed entirely by the `config plugin`_ of the resolver project.

.. _config plugin: https://github.com/ngageoint/opensphere-build-resolver/blob/master/plugins/config/index.js

Only objects accept merges. Everything else is a replacement:

.. code-block:: javascript

  var original = {
    "name": "Katie",
    "age": 29,
    "interests": ["dogs", "skiing"],
    "likesColors": {
      "blue": true,
      "orange": false
    }
  };

  var newInfo = {
    "name": "Katie Smith",
    "age": 30,
    "interests": ["netflix"],
    "height": 150,
    "likesColors": {
      "purple": true,
      "orange": true
    }
  };

  // merge newInfo to original results in
  var merged = {
    "name": "Katie Smith",
    "age": 30,
    "interests": ["netflix"],
    "height": 150,
    "likesColors": {
      "blue": true,
      "orange": true,
      "purple": true
    }
  };

To delete a value, simply assign the value ``"__delete__"``:

.. code-block:: javascript

  var moreInfo = {
    "likesColors": "__delete__"
  }

  // merge moreInfo to our previously merged object results in
  var merged2 = {
    "name": "Katie Smith",
    "age": 30,
    "interests": ["netflix"],
    "height": 150
  };

Settings
========

Here we will go through some of the most important settings individually. If you have any questions on a more minor one, let us know and we will try to get to it soon.

proxy
-----
``admin.proxy``

The proxy is a failover for getting around mixed content and CORS warnings/errors from other servers.

* ``url`` The URL to the proxy; must contain ``{url}`` e.g. ``https://cors-anywhere.herokuapp.com/{url}``
* ``methods`` The list of http methods supported by the proxy. e.g. ``["GET", "POST", ...]``
* ``schemes`` The schemes supported by the proxy. e.g. ``["http", "https"]``
* ``encode`` whether or not to URL-encode the entire URL when replacing ``{url}``. Defaults to ``true``.

Some items can be configured to use the proxy by default (such as basemaps and some providers). However, for most requests, they will first be tried as a normal request and only try the proxy after that request fails.

providers
---------
``admin.providers``

The providers section is the meat of any OpenSphere configuration. This provides all of the data available to the user by default. While they can certainly add their own data servers, a well-curated list is much more likely to keep users coming back.

Usage:

.. code-block:: javascript

  {
    "admin": {
      "providers": {
        "unique-id-1": {
          "type": "geoserver", // or any provider type
          // ... rest of provider-specific config
        },
        // ... more providers
      }
    }
  }

The design there should be simple and clear. However, let's do a specific example. The ``config/settings.json`` file in OpenSphere itself does a good job of showing how to set up the ``basemap`` provider. So we will add a couple of others:

.. code-block:: json

  {
    "admin": {
      "providers": {
        "arc-sample-server": {
          "type": "arc",
          "label": "ArcGIS Online",
          "url": "//services.arcgisonline.com/ArcGIS/rest/services/"
        },
        "demo-geoserver": {
          "type": "geoserver",
          "label": "Demo Geoserver",
          "url": "https://demo.geo-solutions.it/geoserver/ows"
        }
      }
    }
  }

plugins
-------
``admin.plugins``

This is an object map of plugin IDs to booleans that allows you to disable a plugin entirely in config rather than having to build a new version of the application without that plugin.

Say we wanted to disable KML for some reason:

.. code-block:: json

  {
    "admin": {
      "plugins": {
        "kml": false
      }
    }
  }

baseProjection
--------------
``user.baseProjection``

The ``baseProjection`` sets the default projection of the application. This projection should have a corresponding set of default map layers configured in the ``basemap`` provider. OpenSphere ships with support for EPSG:4326 and EPSG:3857 out of the box. Other projections can be added via config.

Users can change this value in Settings > Map > Projection or by adding a tile layer that is in a projection other than the current projection (assuming that ``enableReprojection`` is ``false``).

.. code-block:: json

  {
    "user": {
      "baseProjection": "EPSG:4326"
    }
  }

metrics
-------
``admin.metrics``

OpenSphere has a metrics API that can be used to gather stats about usage. We want to stress that these metrics are *not sent anywhere*. If you would like to have your metrics sent somewhere, you will have to write a plugin to upload them and add that to your OpenSphere build.

However, for the overly paranoid:

.. code-block:: json

  {
    "admin": {
      "metrics": {
        "enabled": false
      }
    }
  }
