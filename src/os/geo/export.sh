#!/bin/bash

# exports os.geo.js for use in other applications that do not use the os library

if [ -z $1 ]; then
  echo "Usage ./export.sh <exportFile>"
  exit 0
fi

/software/javascript/closure/closure-library/closure/bin/build/closurebuilder.py \
  --root=/software/javascript/closure/closure-library \
  --root=../.. \
  --namespace="geo" \
  --output_mode=compiled \
  --compiler_jar=/software/javascript/closure/compiler.jar \
  --compiler_flags="--compilation_level=SIMPLE_OPTIMIZATIONS" > $1
