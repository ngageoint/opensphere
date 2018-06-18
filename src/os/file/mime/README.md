## MIME Type Detection

Our previous content type detection was rather clunky in that it was simply an array of classes which checked the _entire file_. That does not work out so well when given large files. Thus, we have a new stack designed with the following improvements:

### Buffer Size

Since we cannot load a 2GB file into memory, detect functions should be able to work on a single chunk, which may (or may not) be a full file. We plan to send a maximum of the first 16KB to these functions.

- Pros
-- Way less memory usage
-- Can now handle large file types
- Cons
-- Can't use `JSON.parse()`
-- Can't use browser-native XML parsing

What this means in the long run is that we will need to move the parsers for each file type over to a streaming parser. This will allow us to support small files (which we can then store cross-session in IndexedDB), and large files (which we can only use for the session on web, but more permanently in Electron).

### Resource Usage

MIME types are really trees of types. If we store them this way, we can reuse the work of the parent detect function to provide context to its child detections. For example, `text/plain` can detect `true` and pass the resulting string on to its child detection functions: `text/xml`, `application/json`, etc.


The tree:

- `application/octect-stream` (a.k.a. generic binary)
-- `application/zip`
--- `application/vnd.google-earth.kmz`
--- (zipped shapefile)
--- possibly other zipped text/plain types?
-- `text/plain`
--- `application/json`
---- `application/vnd.geo+json`
--- `text/xml`
---- `application/vnd.google-earth.kml+xml`
---- `text/xml; subtype=gml/3.x`
--- `text/csv`

When registering types, it does not actually matter that you use the officially-registered MIME type. It only matters that the type is unique within the tree. However, for clarity and ease of registering child detections, we have opted to use the offical types where available.

Be sure to check out the parent detection function to see what sort of context it passes on to its children (its return value).
