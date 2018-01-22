Plugin
------

Add a basic plugin class.

.. literalinclude:: src/plugin/georss/georssplugin.js-plugin
  :caption: ``src/plugin/georss/georssplugin.js``
  :linenos:
  :language: javascript

Internal Plugins
  If creating an internal plugin, ensure that ``mainctrl.js`` ``goog.require``'s your plugin, or optionally, the external plugin method will also work.

External Plugins
  If creating an external plugin, ensure that ``package.json`` ``build.gcc.entry_point`` has ``goog:plugin.georss.GeoRSSPlugin`` in its list.

Run ``yarn build`` in OpenSphere (not in your plugin if it is external). It should build just fine but it does not do anything yet.

Just for good measure, let's test it.

.. literalinclude:: test/plugin/georss/georssplugin.test.js
  :caption: ``test/plugin/georss/georssplugin.test.js``
  :linenos:
  :language: javascript

Run ``yarn test`` in your plugin project if it is external (not in OpenSphere) to run its tests. For internal plugins, no directory change is necessary.
