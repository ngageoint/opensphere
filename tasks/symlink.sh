cd dist/opensphere/
if [ -L images ]; then
  rm images;
fi

ls -tr | grep '^v1' | head -n -1 | xargs rm -rf --

find ./v1* -maxdepth 0 -type d -exec ln -s {}/images images \;
cd ../..
