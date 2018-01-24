Plugin Guide
============

OpenSphere plugins can add new layer types, new file formats for importing and exporting, new provider or server types for listing available data from various services, new search implementations, new UI elements or windows, and much, much more!

.. toctree::
  :maxdepth: 1
  :caption: Guides

  plugin_file_type_guide/index
  plugin_server_guide/index


New Server/Provider Types
-------------------------

Data providers such as ArcGIS_, Geoserver_, and others are implemented as plugins. If you want to extend OpenSphere to support an additional server type or protocol (like OGC Catalog Service for the Web - CSW), this is the type of plugin you need to implement. Each of them adds:

* The provider (implementation of `os.data.IDataProvider`_), which is responsible for querying the server and creating descriptors for the available layers
* Content Type and/or URL detection for adding new servers of that type, which in turn activates...
* A form for letting the user add a new server of that type
* A layer type if the server has a custom format (e.g. Arc REST service JSON). If the service returns already-implemented formats such as GeoJSON, this is not necessary.

.. _ArcGIS: https://github.com/ngageoint/opensphere/tree/master/src/plugin/arc
.. _Geoserver: https://github.com/ngageoint/opensphere/tree/master/src/plugin/ogc
.. _os.data.IDataProvider: https://github.com/ngageoint/opensphere/blob/master/src/os/data/idataprovider.js


Search Providers
----------------

Search providers (used via the search box in the top right) can search for places, layers, documents, or anything else. The `Google Places`_ and `Descriptor Search`_ plugins are good examples of search providers.

.. _Google Places: https://github.com/ngageoint/opensphere/tree/master/src/plugin/google/places
.. _Descriptor Search: https://github.com/ngageoint/opensphere/tree/master/src/plugin/descriptor


Plugin Examples
---------------

See opensphere-plugin-example_ for an example of setting up an external (or perhaps private) plugin. That is mostly boilerplate intended to get a project started and does not have much in the way of actual code.

Although OpenSphere supports external plugins, it has several "in-tree" plugins which provide functionality that we consider core to the application. These are all useful examples for plugin development, as well as their main purpose of providing useful functionality.

* area_ - adds the ability to import specific file types as areas instead of data layers
* audio_ - adds the ability to import custom audio files for different alert noises
* capture_ - adds the ability to record screenshots and GIF recordings of the timeline
* featureaction_ - adds the ability to run local filter functions on data import that takes the resulting items and applies an action (like changing the style)
* overview_ - adds the small overview map to the top right
* params_ - adds the ability to right-click layers and change the request parameters sent to the server
* places_ - integrates heavily with editable KML from the KML plugin to provide a "Saved Places" layer
* suncalc_ - adds the ability to show Sun/Moon info in a dialog (right-click on the map), in addition to the day/night lightstrip shown in the timeline
* vectortools_ - provides the copy/merge/join options for vector layers
* weather_ - simple plugin just adds an entry to the coordinate menu that launches a weather forecast for that location
* xyz_ - provides support for XYZ (zoom, X/Y) tile layers

Note that some of the plugins have corresponding views_ and tests_.

.. _opensphere-plugin-example: https://github.com/ngageoint/opensphere-plugin-example
.. _area: https://github.com/ngageoint/opensphere/tree/master/src/plugin/area
.. _audio: https://github.com/ngageoint/opensphere/tree/master/src/plugin/audio
.. _capture: https://github.com/ngageoint/opensphere/tree/master/src/plugin/capture
.. _featureaction: https://github.com/ngageoint/opensphere/tree/master/src/plugin/featureaction
.. _overview: https://github.com/ngageoint/opensphere/tree/master/src/plugin/overview
.. _params: https://github.com/ngageoint/opensphere/tree/master/src/plugin/params
.. _places: https://github.com/ngageoint/opensphere/tree/master/src/plugin/places
.. _suncalc: https://github.com/ngageoint/opensphere/tree/master/src/plugin/suncalc
.. _vectortools: https://github.com/ngageoint/opensphere/tree/master/src/plugin/vectortools
.. _weather: https://github.com/ngageoint/opensphere/tree/master/src/plugin/weather
.. _xyz:  https://github.com/ngageoint/opensphere/tree/master/src/plugin/xyz
.. _views: https://github.com/ngageoint/opensphere/tree/master/views/plugin
.. _tests: https://github.com/ngageoint/opensphere/tree/master/test/plugin


