Deployment Guide
################

Build
=====
Our builds zip up the contents of the ``dist`` folder after ``yarn run build`` completes. This results in a zip directory structure like:

.. code-block:: none

  {appName}/
    config/
      settings.json
    v{buildtime}/
      ... code
    index.html

Generally, this build does not include any deployment-specific config. Since we have multiple deployments,
and we do not wish to run the (much longer) full build for each separate deployment, we have other build
jobs which grab the ``settings.json`` file out of this zip, merge in the deployment-specific config, and
save it as ``{app}-{version}-{deployment}.zip``. However, if you only have a single deployment, you may
wish to include your deployment config as a config project during the main build.

Settings
========

See our :ref:`settings-guide` to get familiar with the main settings to configure for your deployment, such as
remote servers and base map layers.

HTTP Server
===========
We highly recommend the use of nginx to serve the application. However, since the application is entirely
static html, js, css, etc. it can be served with any HTTP server. The following config examples will be using
nginx.


Define the WASM type
--------------------
Our build includes some ``*.wasm`` files. Browsers complain in the console if the mime type is not set properly for these.

.. code-block:: none

  http {
    ...

    include mime.types;
    types {
      application/wasm wasm;
    }
  }


Enable GZIP
-----------
This should go without saying. Nevertheless:

.. code-block:: none

  http {
    ...

    gzip on;
    gzip_disable "msie6";
    gzip_min_length 1100;
    gzip_vary on;
    gzip_buffers 16 8k;
    gzip static always;
    gzip_types text/plain text/css text/js text/xml text/html text/javascript application/javascript application/x-javascript application/json application/xml application/xml+rss application/wasm;
 }


Caching
-------
We should allow the browser to cache config for a couple of hours and the version folder (``v{buildtime}``) for as
long as possible.

.. code-block:: none

  http {
    ...
    server {
      ...
      # allow clients to cache config for a couple of hours
      location ^~ /opensphere/config/ {
        add_header 'Cache-Control' 'max-age=7200, public' always;
      }

      # anything under the version directories should be cached for the maximum (one year)
      location ^~ /opensphere/v\d+/ {
        add_header 'Cache-Control' 'max-age=31557600, public' always;
      }
    }
  }

.. note:: If you dropped the app name (such that the application is available directly on ``yourdomain.com/`` rather than ``yourdomain.com/opensphere``), you will need to drop the ``/opensphere`` off the location directives in the above example.


Deploying
---------
The directory structure is designed to simply be unzipped over old installs. This allows users with cached ``index.html``
pages to previous versions to work until they request ``index.html`` again after that cache expires (generally 20-30 minutes).
Therefore, just ``cd`` to the document root and unzip the file (and ensure that permissions are set correctly for your server, of course).


API Keys
========
Some data or search providers require an API Key to function. For development, you can merely drop the API Key directly
in config:

.. warning:: The following is acceptable for dev config but should not be done in production! Anyone who uses the application
  will have access to the API Key.

.. code-block:: json

  {
    "admin": {
      "plugin": {
        "myplugin": {
          "url": "https://api.somecoolsite.com/search?q={q}&api_key=SOMETHING"
        }
      }
    }
  }

For production, it is better to hide that API behind a proxy that you control.

.. code-block:: none

  http {
    ...
    server {
      ...
      location /somecoolsite/search {
        set $args $args&api_key=SOMETHING;
        proxy_pass https://api.somecoolsite.com/search;
      }
    }
  }

And the production config:

.. code-block:: json

  {
    "admin": {
      "plugin": {
        "myplugin": {
          "url": "/somecoolsite/search?q={q}"
        }
      }
    }
  }
