Time Support
------------

You may have noticed that there is a little clock icon on the layer. The parent class to our descriptor, ``os.data.FileDescriptor``, sets the ``animate`` flag to ``true`` in our layer options:

.. literalinclude:: ../../../src/os/data/filedescriptor.js
  :linenos:
  :language: javascript
  :lines: 85-101
  :emphasize-lines: 5

That turns on time indexing on the layer. However, nothing is taking the time values from the ``<updated>`` tags in the GeoRSS entries and turning them into ``os.time.TimeInstant`` values in the proper place on the feature. Hence every feature is treated as "timeless" even though the source has time indexing enabled. This is where mappings come in.

Import mappings all implement ``os.im.mapping.IMapping`` and are used to either change fields (e.g. unit conversion) or derive fields (e.g. LAT/LON columns in CSVs to ``ol.geom.Point``, adding altitude, etc.). However, the most common mappings of all are time mappings. Import UIs for types such as GeoJSON and CSV generally walk the user through creating these mappings (CSV, being the worst file format of all time for geospatial data, has to basically create every type of mapping possible).

In our case, we have several options.

**Reinvent the wheel**

We could simply parse the time in our parser since the format is common and only shows up in one place (the ``<updated>`` tag). KML is similar in this regard as the format and tags for time are defined in the spec. But that really just duplicates code that exists within the mappings.

**Define a mapping explicitly**

We could define a ``os.im.mapping.time.DateTimeMapping`` instance ourselves. This could be placed in several different places but the best place is probably the layer config. That would look something like this:

.. literalinclude:: src/plugin/georss/georsslayerconfig.js-time_support-explicit
  :caption: ``src/plugin/georss/georsslayerconfig.js``
  :linenos:
  :language: javascript
  :emphasize-lines: 2-3, 27-40

**Use the auto-detected mappings**

Because many import UIs configure mappings, it helps the user if those default to the best value possible. Therefore, OpenSphere includes auto-detection logic with each mapping to make a best guess on what the mapping should be based on the fields and values available in a sample of records from the source. We could simply make use of that like so:

.. literalinclude:: src/plugin/georss/georsslayerconfig.js-time_support-auto
  :caption: ``src/plugin/georss/georsslayerconfig.js``
  :linenos:
  :language: javascript
  :emphasize-lines: 25-37

After picking any of those options, fire up the debug instance and load your URL. Open the timeline by clicking the yellow clock icon in the Date Control at the top or choosing Windows > Timeline. If you were using a recent feed, you should see your data for today immediately and you can hit the Play button to animate it. If your data is older, you can zoom/pan to it and draw (or explicitly set) a new Load or Animation range before playing.

To complete testing of the importer, we can extend the tests as shown below:

.. literalinclude:: test/plugin/georss/georsslayerconfig.test.js_importer
  :caption: ``test/plugin/georss/georsslayerconfig.test.js``
  :linenos:
  :language: javascript
  :lines: 1-14
  :emphasize-lines: 10-13

That concludes the File Type Plugin Guide! If you have any further questions or requests for new guides, please feel free to use our `GitHub issues`_. Also, remember to check out the `core plugins`_ as examples for other things you can do!.

.. _GitHub issues: https://github.com/ngageoint/opensphere/issues
.. _core plugins: https://github.com/ngageoint/opensphere/tree/master/src/plugin
