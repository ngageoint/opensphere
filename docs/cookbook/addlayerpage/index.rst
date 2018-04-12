Add Layer Page
==============

Problem
-------

We want to support links that add layers or files to OpenSphere.

Solution
--------

The OpenSphere ``addlayer.html`` page. This page is built alongside OpenSphere and takes a
URI-encoded JSON string in the fragment, decodes it and passes it over to OpenSphere
(or opens OpenSphere if it is not already up).

Discussion
----------

File URL
........

Use a path of:

.. code-block:: javascript

  'example.com/path/to/opensphere/addlayer.html#file=' +
      encodeURIComponent(fileUrl);

This prompts the user to import the file in the application. However, for many files, you
may want to set all of your options up ahead of time so that the user does not have to
figure them out in the Import Wizard.

Therefore, you may want to use Layer Configs instead.

Layer Config
............

Use a path of:

.. code-block:: javascript

  'example.com/path/to/opensphere/addlayer.html#' +
      encodeURIComponent(JSON.stringify(conf));

where ``conf`` is a JSON layer config. This is not the proper place to go into all the
available layer configs, but one of the simplest possible configs is:


.. code-block:: javascript

  {
    "type": "WMS",
    "url": "https://demo.geo-solutions.it/geoserver/ows",
    "params": "LAYERS=topp:states",
    "projection": "EPSG:4326",
    "title": "US States"
  }

However, you may want to add other common options such as:

.. code-block:: javascript

  {
    "type": "WMS",
    "url": "https://demo.geo-solutions.it/geoserver/ows",
    "params": "LAYERS=topp:states",
    "title": "US States",
    "projection": "EPSG:4326",

    // give them some credit
    "description": "States colored by population provided by geo-solutions.it",
    "attributions": ["geo-solutions.it"],
    "provider": "geo-solutions.it demo GeoServer",

    // don't load tiles outside of this extent
    "extent": [-124.731422, 24.955967, -66.969849, 49.371735],
    "extentProjection": "EPSG:4326",

    // whether or not use the configured proxy (if any)
    "proxy": false,

    // CORS is annoying; We try to auto-detect the proper value, but
    // it can also be set explicitly
    "crossOrigin": "anonymous",

    // you can also set default style parameters like opacity, color, etc.
    "opacity": 0.5
  }

Every layer that can be shown by OpenSphere has a layer config that can be used here. Note,
however, that the layer is transient and will not be saved between sessions (as of now, anyway).
You can save a state file in OpenSphere to preserve them if you like.
