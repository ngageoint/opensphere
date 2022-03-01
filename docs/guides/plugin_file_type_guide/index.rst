.. _file-type-guide:

File Type Plugin Guide
======================

Here we will walk through creating a plugin for a new vector file type, georss-simple_. There are many other examples of file type support within OpenSphere itself, so have a `look  here`_ for more examples.

.. _georss-simple: http://www.georss.org/simple.html
.. _look here: https://github.com/ngageoint/opensphere/tree/master/src/plugin/file

If you wish for this to be an external, separately released plugin, then fork opensphere-plugin-example_ and follow the instructions in its readme as a starting point.

.. _opensphere-plugin-example: https://github.com/ngageoint/opensphere-plugin-example

If you wish for this to be a core plugin included with OpenSphere then simply begin adding your plugin code to ``src/plugin/yourplugin``. However, if you are serious about getting your plugin included to the core project, please create an issue for it so we can discuss it.

.. toctree:: 
  :maxdepth: 1

  plugin
  parser
  layer_config
  content_type
  launcher
  provider
  descriptor
  import_ui
  time_support
