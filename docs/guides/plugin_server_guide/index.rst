Server Plugin Guide
===================

Here we walk through creating a plugin for a new server or provider type: `Tileserver-GL`_. There are other examples of these in OpenSphere, such as `OGC`_ (WMS/WFS) and `ArcGIS`_.

.. _ArcGIS: https://github.com/ngageoint/opensphere/tree/master/src/plugin/arc
.. _OGC: https://github.com/ngageoint/opensphere/tree/master/src/plugin/ogc
.. _Tileserver-GL: https://github.com/klokantech/tileserver-gl

With any server type, it is important to have an instance we can hit for testing. Follow the instructions in the `Tileserver-GL`_ README (download a datafile and fire up the Docker container). If you have installed httpd or nginx, you may want to pick a different port mapping from those instructions so that the ports do not conflict. This guide assumes port 8081.

After that is done, you should be able to hit ``http://localhost:<port>/index.json``. This is the file that our server type will read.

If you wish for this to be an external, separately released plugin, then fork opensphere-plugin-example_ and follow the instructions in its readme as a starting point.

.. _opensphere-plugin-example: https://github.com/ngageoint/opensphere-plugin-example

If you wish for this to be a core plugin included with OpenSphere then simply begin adding your plugin code to ``src/plugin/yourplugin``. However, if you are serious about getting your plugin included to the core project, please create an issue for it so we can discuss it.

.. toctree:: 
  :maxdepth: 1

  plugin
  provider
  parsing
  server_ui
