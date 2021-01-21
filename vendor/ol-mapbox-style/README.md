## stylefunction.js

This is a custom build of the `ol-mapbox-style` project available on npm. The
default build uses the full build artifact from `@mapbox/mapbox-gl-style-spec`,
which results in a library much too large for what we are using it for (300+KiB
uncompressed).

The custom build is 99KiB (24 gzipped), which is workable.
