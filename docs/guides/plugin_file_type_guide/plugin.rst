Plugin
------

Add a basic plugin class.

.. literalinclude:: src/plugin/georss/georssplugin.js
  :caption: ``src/plugin/georss/georssplugin.js``
  :linenos:
  :language: javascript

* Internal - Ensure that ``mainctrl.js`` ``goog.require``'s your plugin
* External - Ensure that ``package.json`` ``build.gcc.entry_point`` has ``goog:plugin.georss.GeoRSSPlugin`` in its list

Run ``yarn build`` in OpenSphere (not in your plugin if it is external). It should build just fine but it does not do anything yet.

