File Type Plugin Guide
======================

(work-in-progress: Will is actively writing this up)

Here we will walk though creating a plugin for a new vector file type, georss-simple_.

.. _georss-simple: http://www.georss.org/simple.html

Boilerplate
-----------

If you wish for this to be an external, separately released plugin, then fork opensphere-plugin-example_ and follow the instructions in its readme as a starting point.

.. _opensphere-plugin-example: https://github.com/ngageoint/opensphere-plugin-example

If you wish for this to be a core plugin included with OpenSphere then simply begin adding your plugin code to ``src/plugin/yourplugin``. However, if you are serious about getting your plugin included to the core project, please create an issue for it so we can discuss it.

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

.. toctree:: 
  :maxdepth: 1

  parser
  layer_config
  content_type
  launcher
  import_ui
