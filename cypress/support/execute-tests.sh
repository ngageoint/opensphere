#!/usr/bin/env bash

function main() {
  echo 'INFO: test execution script starting...'
  trap ctrl_c INT

  setVariables
  checkArguments
  configureSound
  overrideSettings
  startWebServer
  runTests
  stopWebServer
  restoreSettings

  echo 'INFO: test execution script completed!'
  exit $TEST_RESULT
}

function ctrl_c() {
  echo "WARNING: user terminated tests, performing cleanup..."
  stopWebServer
  restoreSettings
  echo 'INFO: cleanup complete, test execution script terminated early'
  exit 1
}

function setVariables() {
  export SERVER_STARTED=false
  export SETTINGS_BACKED_UP=false

  export SOUND_CONFIGURATION_SOURCE=cypress/support/asound.conf
  export SOUND_CONFIGURATION_TARGET=/etc/asound.conf

  export SETTINGS_ORIGINAL=dist/opensphere/config/settings.json
  export SETTINGS_BACKUP=dist/opensphere/config/settings.bak
    
  export SETTINGS_OVERRIDE_2D_SOURCE=cypress/support/settings/override-2d.json
  export SETTINGS_OVERRIDE_PROJECTION_SOURCE=cypress/support/settings/override-projection.json
  export SETTINGS_OVERRIDE_TARGET=dist/opensphere/config/settings.json

  if [ "$CYPRESS_PROJECTION" == 4326 ]; then
    echo "INFO: overriding projection; using EPSG:4326"
    export SETTINGS_OVERRIDE_SOURCE=$SETTINGS_OVERRIDE_PROJECTION_SOURCE
  else
    echo "INFO: using default projection EPSG:3857"
    export SETTINGS_OVERRIDE_SOURCE=$SETTINGS_OVERRIDE_2D_SOURCE
  fi
  
  export SETTINGS_DEFAULT_SOURCE=config/settings.json
  export SETTINGS_DEFAULT_TARGET=dist/opensphere/config/settings-default.json
  export SETTINGS_CYPRESS_2D_SOURCE=cypress/support/settings/settings-2d.json
  export SETTINGS_CYPRESS_2D_TARGET=dist/opensphere/config/settings-2d.json
  export SETTINGS_CYPRESS_PROJECTION_SOURCE=cypress/support/settings/settings-projection.json
  export SETTINGS_CYPRESS_PROJECTION_TARGET=dist/opensphere/config/settings-projection.json
    
  export ALL_TESTS=**
  export SMOKE_TESTS=smoke-tests/**
  export TEST_PATH=cypress/integration/
  
  export TEST_RESULT
}

function checkArguments() {
  if ! [[ "$ENVIRONMENT" =~ ^(dev|ci)$ ]]; then
    echo "ERROR: only dev and ci accepted as a valid environment argument; '$ENVIRONMENT' is not valid"
    exit 1
  fi

  if ! [[ "$MODE" =~ ^(cli|gui)$ ]]; then
    echo "ERROR: only cli and gui accepted as a valid mode argument; '$MODE' is not valid"
    exit 1
  fi

  case "$TESTS" in
	"all")
    TEST_SPECS=$TEST_PATH$ALL_TESTS
		;;
	"smoke")
    TEST_SPECS=$TEST_PATH$SMOKE_TESTS
		;;
  "spec")
    TEST_SPECS=$TEST_PATH$SPEC
		;;
  "loop")
    if [ -z "$SPEC" ]; then
      echo 'WARNING: Spec pattern not passed, selecting ALL tests'
      TEST_SPECS=$TEST_PATH$ALL_TESTS
    else
      TEST_SPECS=$TEST_PATH$SPEC
    fi
    ;;
	*)
		if [ -z "$TESTS" ]; then
      if ! [ "$MODE" == "gui" ]; then
        echo 'ERROR: tests argument must be supplied unless mode is gui'
        exit 1
      fi
    else
      echo "ERROR: only all, smoke, spec, or loop accepted as a valid tests argument; '$TESTS' is not valid"
      exit 1
    fi
		;;
  esac

  if [ "$CYPRESS_PROJECTION" ]; then
    if [ ! "$CYPRESS_PROJECTION" == 4326 ]; then
      echo "ERROR: CYPRESS_PROJECTION environment variable set to unexpected value: $CYPRESS_PROJECTION. Expected 4326!"
      exit 1
    fi

    if [ ! "$STREET_MAP_URL" ]; then
      echo "ERROR: STREET_MAP_URL environment variable not set! This is expected when overriding the projection."
      exit 1
    fi

    if [ ! "$WORLD_IMAGERY_URL" ]; then
      echo "ERROR: WORLD_IMAGERY_URL environment variable not set! This is expected when overriding the projection."
      exit 1
    fi
  fi
}

function backupSettings(){
  if [ -f $SETTINGS_ORIGINAL ]; then
    echo 'INFO: build settings file exists and may need to be backed up'
    if ! diff -q $SETTINGS_DEFAULT_SOURCE $SETTINGS_ORIGINAL; then
      echo "INFO: settings file differs from source, backing up as $SETTINGS_BACKUP"
      SETTINGS_BACKED_UP=true
      mv $SETTINGS_ORIGINAL $SETTINGS_BACKUP
    else
      echo 'INFO: settings file matches source and does not need to be backed up'
    fi
  else
    echo 'INFO: build settings file does not need to be backed up because it does not exist'
  fi
}

function configureSound() {
  if [ "$ENVIRONMENT" == "ci" ]; then
    echo "INFO: Configuring sound ouput (fixes ALSA errors)"
    sudo cp $SOUND_CONFIGURATION_SOURCE $SOUND_CONFIGURATION_TARGET
  fi
}

function overrideSettings() {
  backupSettings

  echo "INFO: creating a new settings override file: $SETTINGS_OVERRIDE_TARGET"
  cp $SETTINGS_OVERRIDE_SOURCE $SETTINGS_OVERRIDE_TARGET

  echo "INFO: creating default settings file: $SETTINGS_DEFAULT_TARGET"
  cp $SETTINGS_DEFAULT_SOURCE $SETTINGS_DEFAULT_TARGET

  echo "INFO: creating 2D mode settings file: $SETTINGS_CYPRESS_2D_TARGET"
  cp $SETTINGS_CYPRESS_2D_SOURCE $SETTINGS_CYPRESS_2D_TARGET

  if [ "$CYPRESS_PROJECTION" == 4326 ]; then
    echo "INFO: creating projection settings file: $SETTINGS_CYPRESS_PROJECTION_TARGET"
    cp $SETTINGS_CYPRESS_PROJECTION_SOURCE $SETTINGS_CYPRESS_PROJECTION_TARGET
    sed -i 's/STREET_MAP_URL/'$STREET_MAP_URL'/g' $SETTINGS_CYPRESS_PROJECTION_TARGET
    sed -i 's/WORLD_IMAGERY_URL/'$WORLD_IMAGERY_URL'/g' $SETTINGS_CYPRESS_PROJECTION_TARGET
  fi
}

function startWebServer() {
  if [ "$OSTYPE" == "msys" ]; then
    webServerProcess="$(netstat -ano | findstr 0.0.0.0:8282 | awk '{print $5}')" # TODO: Use a process name instead after this is fixed: https://github.com/http-party/http-server/issues/333
  else
    webServerProcess=$(ps -ef | grep http-server | grep -v grep)
  fi
  
  if [ -z "$webServerProcess" ]; then
    SERVER_STARTED=true
    if [ "$ENVIRONMENT" == "ci" ]; then
      echo 'INFO: starting web server in continuous integration environment'
      $(npm bin)/http-server -p 8282 -c-1 -s &
    else
      echo 'INFO: starting web server in local development environment'
      $(npm bin)/http-server ../../ -p 8282 -c-1 -s &
    fi
  else
    echo 'INFO: web server already running'
  fi
}

function runTests() {
  if [ "$MODE" == "cli" ]; then
    if [ "$ENVIRONMENT" == "ci" ]; then
      echo 'INFO: starting Cypress in continuous integration environment'
      $(npm bin)/cypress run --config baseUrl=http://localhost:8282/dist/opensphere --spec "$TEST_SPECS"
      TEST_RESULT=$?
    else
      echo 'INFO: starting Cypress in local development environment via the command line'
      if [ "$TESTS" == "loop" ]; then
        result_counter=0
        echo 'INFO: starting test loop to check for flaky tests'
        for i in 1 2 3 4 5
        do
          echo "INFO: test run $i/5 starting..."
          $(npm bin)/cypress run --spec "$TEST_SPECS"
          last_result=$?
          echo "INFO: test run $i/5 finished with code: $last_result"
          result_counter=$(($result_counter + $last_result))
        done
        TEST_RESULT=$result_counter
        if (( $TEST_RESULT > 0)); then
          if (( $TEST_RESULT == 5)); then
            echo "WARNING: each test loop finished with code: 1. Tests appear to consisently FAIL."
          else
            echo 'WARNING: *******************'
            echo "WARNING: FLAKY TESTS!! There were $TEST_RESULT failed loops out of 5 loops completed."
            echo 'WARNING: *******************'
          fi
        else
          echo 'INFO: test loop finished, all loops passed'
        fi
      else
        $(npm bin)/cypress run --spec "$TEST_SPECS"
        TEST_RESULT=$?
        echo "INFO: Cypress tests finished with code: $TEST_RESULT"
      fi
    fi
  else
    echo 'INFO: starting Cypress in local development environment via interactive mode'
    $(npm bin)/cypress open
    echo 'INFO: user has closed Cypress interactive mode'
  fi
}

function stopWebServer() {
  if $SERVER_STARTED; then
    echo 'INFO: terminating web server'
    if [ "$OSTYPE" == "msys" ]; then
      webServerProcess="$(netstat -ano | findstr 0.0.0.0:8282 | awk '{print $5}')" # TODO: Use a process name instead after this is fixed: https://github.com/http-party/http-server/issues/333
      taskkill //PID $webServerProcess //F
    else
      npm run stop-server
    fi
  else
    echo 'INFO: server was running before tests started, leaving it running'
  fi
}

function restoreSettings() {
  echo "INFO: removing settings override file: $SETTINGS_OVERRIDE_TARGET"
  rm $SETTINGS_OVERRIDE_TARGET
  
  echo "INFO: removing default settings file: $SETTINGS_DEFAULT_TARGET"
  rm $SETTINGS_DEFAULT_TARGET

  echo "INFO: removing 2D mode settings file: $SETTINGS_CYPRESS_2D_TARGET"
  rm $SETTINGS_CYPRESS_2D_TARGET

  if [ "$CYPRESS_PROJECTION" == 4326 ]; then
    echo "INFO: removing projection settings file: $SETTINGS_CYPRESS_PROJECTION_TARGET"
    rm $SETTINGS_CYPRESS_PROJECTION_TARGET
  fi

  restoreBackup
}

function restoreBackup() {
  if $SETTINGS_BACKED_UP; then
    echo "INFO: restoring backup $SETTINGS_BACKUP as $SETTINGS_ORIGINAL"
    mv $SETTINGS_BACKUP $SETTINGS_ORIGINAL
  else
    echo "INFO: settings file backup does not exist, using default settings file: $SETTINGS_DEFAULT_TARGET"
    cp $SETTINGS_DEFAULT_SOURCE $SETTINGS_OVERRIDE_TARGET
  fi
}

#dev or ci
ENVIRONMENT=$1

#cli or gui
MODE=$2

#all, smoke, spec, loop
TESTS=$3

#spec
SPEC=$4

main