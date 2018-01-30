OpenStreetMap
=============

Problem
-------

You'd like to use an alternative base map, such as OpenStreetMap (OSM), for cartographic styling reasons or to provide a suitable base map on an isolated network.


Solution
--------

Modify the config settings to specify an additional or alternative base map provider.

The following code shows how to change the config settings to add an additional basemap. Note that the existing "streetmap" and "worldimagery" parts, and other elements, are skipped to simplify the presentation. You can make other changes to meet your requirements, but removing existing items is not necessary to add a new provider.

.. code-block:: json
  :caption: ``config/settings.json``

  {
    "providers": {
      "basemap": {
        "maps": {
          "osm": {
            "title": "OpenStreetMap",
            "type": "BaseMap",
            "baseType": "XYZ",
            "provider": "OSM",
            "url": "//c.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "minZoom": 2,
            "maxZoom": 19,
            "projection": "EPSG:3857",
            "tileSize": 256,
            "description": "OpenStreetMap rendered tiles.",
            "attributions": ["© <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"]
          }
        }
      }
    }
  }


If you want the "osm" basemap to be shown by default, add it to the :code:`defaults` section as shown here:

.. code-block:: json

  {
    "providers": {
      "basemap": {
        "type": "basemap",
        "defaults": {
          "EPSG:4326": [],
          "EPSG:3857": ["worldimagery", "streetmap", "osm"]
        }
      }
    }
  }

Discussion
----------

The XYZ plugin supports a standard, efficient way of transferring maps as gridded tiles at different zoom levels - sometimes called "Tile Map Service" or TMS. Note that this is not the same as Web Map Tile Service (WMTS).

.. note:: Review the terms of service for any tile server you are using, especially acceptable usage limits and attribution requirements.

The key parts of the configuration are the :code:`url`, which includes placeholders for the zoom level, and X/Y indices for tiles. There are other tile servers available, which will have different URL content, potentially including requiring the placeholders in a different order. Note that the URL text does not include the protocol part. Also note that the URL is sometimes shown with :code:`${z}` style placeholders, which are not supported by OpenSphere. However :code:`%z` style placeholders are supported as an alternative to the :code:`{z}` style.

If your provider supports multiple URLs (which is the case for most OSM styles), you can replace the :code:`url` with :code:`urls`, as shown below:

.. code-block:: json
  :caption: ``config/settings.json``

  {
    "providers": {
      "basemap": {
        "maps": {
          "osm": {
            "title": "OpenStreetMap",
            "type": "BaseMap",
            "baseType": "XYZ",
            "provider": "OSM",
            "urls": ["//a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "//b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "//c.tile.openstreetmap.org/{z}/{x}/{y}.png"],
            "minZoom": 2,
            "maxZoom": 19,
            "projection": "EPSG:3857",
            "tileSize": 256,
            "description": "OpenStreetMap rendered tiles.",
            "attributions": ["© <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"]
          }
        }
      }
    }
  }

Another way to express that is :code:`//{a-c}.tiles.example.com/osm/{z}/{x}/{y}.png`, where the :code:`{a-c}` part will be expanded. You can use single letter (upper or lower case) or single number ranges (e.g. :code:`{0-4}`) as appropriate to your server naming.

Other important values are the :code:`minZoom` and :code:`maxZoom` values, which specify the zoom levels that OpenSphere will show this base map at. Different OSM tile servers will support different zoom levels (e.g. the Humanitarian style is provided to zoom level 20).

You can also set up your own tile server, using the same system that OSM uses - see `switch2osm <https://switch2osm.org/serving-tiles/>`_ or a more general server like `GeoServer <http://docs.geoserver.org/latest/en/user/geowebcache/index.html>`_ .

