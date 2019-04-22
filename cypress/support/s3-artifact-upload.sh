#!/usr/bin/env bash

function main() {
  echo 'INFO: S3 artifact upload script starting...'

  if [ "$TRAVIS_PULL_REQUEST" = "false" ]; then
    setVariables
    uploadScreenshots
    uploadSnapshots
    uploadVideos
  else
    echo 'INFO: PRs do not have access to S3 keys, skipping artifact upload.'
  fi
  
  echo 'INFO: S3 artifact upload script completed!'
}

function setVariables() {
  bucket="opensphere-travis-artifacts"
  key_id=$S3KEY
  key_secret=$S3SECRET
  date="$(LC_ALL=C date -u +"%a, %d %b %Y %X %z")"
}

function s3Upload {
  file=$1
  path="$TRAVIS_BRANCH/$TRAVIS_BUILD_NUMBER/${file// /"_"}"

  echo "INFO: Uploading... $(echo $file | sed 's?cypress/??g')"
  sig="$(printf "PUT\n\n\n$date\n/$bucket/$path" | openssl sha1 -binary -hmac "$key_secret" | base64)"
  curl -T $file http://$bucket.s3.amazonaws.com/$path \
      -H "Date: $date" \
      -H "Authorization: AWS $key_id:$sig"
}

function uploadSnapshots() {
  if $S3SNAPSHOT; then
    echo "INFO: Snapshot upload enabled, checking for snapshots to upload"
    snapshots=$(find ./cypress/snapshots -name "*diff.png")
    if ! [ -z "$snapshots" ]; then
      echo "INFO: Snapshots found"
      for result in $snapshots; do
        file=$(echo $result | sed 's?\./??g')
        s3Upload "$file"
      done
      echo "INFO: Finished uploading snapshots"
    else
      echo "INFO: No snapshots found for upload"
    fi
  else
    echo "INFO: Snapshot upload disabled, skipping"
  fi
}

function uploadScreenshots() {
  if $S3SCREENSHOT; then
    echo "INFO: Screenshot upload enabled, checking for screenshots to upload"
    IFS=$'\n'
    screenshots=$(find ./cypress/screenshots -name "*.png")
    if ! [ -z "$screenshots" ]; then
      echo "INFO: Screenshots found"
      for result in $screenshots; do
        file=$(echo $result | sed 's?\./??g')
        s3Upload "$file"
      done
      echo "INFO: Finished uploading screenshots"
    else
      echo "INFO: No screenshots found for upload"
    fi
  else
    echo "INFO: Screenshot upload disabled, skipping"
  fi
}

function uploadVideos() {
  if $S3VIDEO; then
    echo "INFO: Video upload enabled, checking for videos to upload"
    videos=$(find ./cypress/videos -name "*.mp4")
    if ! [ -z "$videos" ]; then
      echo "INFO: Videos found"
      for result in $videos; do
        file=$(echo $result | sed 's?\./??g')
        s3Upload "$file"
      done
      echo "INFO: Finished uploading videos"
    else
      echo "INFO: No videos found for upload"
    fi
  else
    echo "INFO: Video upload disabled, skipping"
  fi
}

main