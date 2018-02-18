Data Provider
-------------

In OpenSphere, the Add Data window (in its default Source view) shows a tree that is essentially Data Providers (root nodes) and Data Descriptors (leaf nodes). We want to add a Data Provider for our GeoRSS file type.

.. literalinclude:: src/plugin/georss/georssprovider.js
  :caption: ``src/plugin/georss/georssprovider.js``
  :linenos:
  :language: javascript

Here is a quick test for it:

.. literalinclude:: test/plugin/georss/georssprovider.test.js
  :caption: ``test/plugin/georss/georssprovider.test.js``
  :linenos:
  :language: javascript

Run ``yarn test`` to ensure that works. Now let's register it in the plugin.

.. literalinclude:: src/plugin/georss/georssplugin.js-provider
  :caption: ``src/plugin/georss/georssplugin.js``
  :linenos:
  :language: javascript
  :emphasize-lines: 3, 8, 47-55

That registers it, but providers are only instantiated if they exist in config (added by either the admin or user in Settings > Data Servers). Let's add some default config. This file is found by looking at ``package.json`` ``build.config``'s values. In OpenSphere it happens to be ``config/settings.json``, however, your project could define a different one (or several config files).

This blurb needs to be in your config.

.. code-block:: json

  {
    "admin": {
      "providers": {
        "georss": {
          "type": "georss"
        }
      }
    }
  }

Similarly to layer configs, providers are instantiated by type. Pull up the debug instance of OpenSphere and drop this in the console to ensure the new provider is there.

.. code-block:: javascript

  os.dataManager.getProviderRoot().getChildren().filter(
    p => p instanceof plugin.georss.GeoRSSProvider)

If it is not there, you may have a cache issue with your settings file. You can either navigate to the settings file directly and give it a hard refresh (ctrl/cmd+shift+r in Chrome), clear your full cache, or use the Dev Tools to disable the cache.
