.. _app-code-guide:

Application Structure
=====================

This guide explains the general structure of the OpenSphere example application, and how it wires up some basics needed to use the OpenSphere map.

Closure Entry Point
-------------------

In the :doc:`../app_package_guide/index`, we saw how the Closure Compiler entry point was set to ``example``. This namespace is provided by `example.js <https://github.com/ngageoint/opensphere-app-example/blob/master/src/example/example.js>`_, which is responsible for initializing the application.

The first two lines in the initialization routine are fairly simple. We first configure the app's primary Angular module, `example.Module`_, with a route provider that will load our ``example-main`` directive (the main app) when Angular is bootstrapped. Then we configure OpenSphere's request stack to use the default set of request handlers. You can customize which of these are loaded if you'd like, but the default set will handle:

* Local files in `File Storage <https://github.com/ngageoint/opensphere/blob/master/src/os/file/filestorage.js>`_
* Same domain requests
* Cross-domain requests (supports CORS, with or without credentials)
* Proxy requests (requires a proxy to be configured in settings)

Next we initialize settings. OpenSphere stores application settings using the browsers IndexedDB API, with a fallback to localStorage if that isn't available. To ensure settings are loaded and available before the application tries to access them, we manually bootstrap Angular after they're loaded.

The example app creates a `Settings Initializer <https://github.com/ngageoint/opensphere-app-example/blob/master/src/example/examplesettingsinitializer.js>`_ that extends the base class from OpenSphere to override the root Angular ``ng-app`` module with `example.Module`_. This initializer loads settings from storage, then bootstraps the module.

.. _example.Module: https://github.com/ngageoint/opensphere-app-example/blob/master/src/example/examplemodule.js


Index
-----

The `index template <https://github.com/ngageoint/opensphere-app-example/blob/master/index-template.html>`_ for our example application has two critical pieces that pair with the initialization routine. The ``#ng-app`` div will be the bootstrap target for the settings initializer, and the ``ng-view`` directive inside of it will be the target of our configured ``$routeProvider`` service. This will inject our application directive into the page when Angular is bootstrapped.

.. note::

  You can customize the selector used to bootstrap Angular with the ``ngAppSelector`` property on the settings initializer. The example uses the default of ``#ng-app``.

The template also has an ``ng-init`` directive that will configure the application version string and the path to the distribution version directory, which is used to locate templates and other resources.

.. note::

  OpenSphere's build separates ``index.html`` from other application resources, which are placed in a version directory. This is intended to allow web servers to cache ``index.html`` for a short amount of time, while caching other resources for a much longer time. When releasing a new version of the application, the new version directory can be deployed alongside the old and as users' ``index.html`` cache expires they will pick up the new version.

Main Directive
--------------

The `main directive <https://github.com/ngageoint/opensphere-app-example/blob/master/src/example/examplemain.js>`_ for the example application sets up the core systems defined in OpenSphere. Since the app intends to use the ``map`` directive, it must configure:

* A data manager to manage the Openlayers data sources added to the map
* Any map interactions and UI controls
* Which plugins are loaded

Interactions and Controls
*************************

Openlayers provides an `interaction API <http://openlayers.org/en/latest/apidoc/ol.interaction.html>`_ that OpenSphere uses and extends for the Cesium 3D globe. The example app adds some simple keyboard/mouse interactions for pan, zoom, etc. More complex interactions are available for features like data selection, drawing geometries, drawing measurement lines, and others. To see some of the other available interactions, see `os.map.interaction <https://github.com/ngageoint/opensphere/blob/master/src/os/map/mapinteractions.js>`_ in OpenSphere.

OpenSphere also uses the Openlayers `control API <http://openlayers.org/en/latest/apidoc/ol.control.html>`_ to add UI components to the map. The example app adds some basics for map zoom/rotation, and also for toggling between a 2D map (Openlayers) and 3D globe (Cesium). To see more interactions used by OpenSphere, take a look at `os.control <https://github.com/ngageoint/opensphere/blob/master/src/os/control/control.js>`_.

Plugins
*******

OpenSphere is designed to be extended via plugins. In our example app, we add a few plugins that add some map-related features:

* Loading WMS/WFS layers from OGC servers
* Adding XYZ map layers
* Configuring a set of base maps
* Loading supported file types (CSV, KML, GeoJSON, GPX, SHP)

OpenSphere has a number of other plugins available. To browse what's available, take a look at OpenSphere's `addPlugins call <https://github.com/ngageoint/opensphere/blob/master/src/os/mainctrl.js#L486>`_ or the `plugin directory <https://github.com/ngageoint/opensphere/tree/master/src/plugin>`_ in the source. For more information on creating new plugins, see the :doc:`../plugin_guide`.
