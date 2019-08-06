echo 'INFO: Patch windows script starting...'

echo 'INFO: Removing old cypress and http-server symlinks'
rm node_modules/.bin/cypress
rm node_modules/.bin/http-server

echo 'INFO: Replacing with Windows versions'
cp cypress/support/windows/cypress node_modules/.bin
cp cypress/support/windows/cypress.cmd node_modules/.bin
cp cypress/support/windows/http-server node_modules/.bin
cp cypress/support/windows/http-server.cmd node_modules/.bin
cp cypress/support/windows/run-os node_modules/.bin
cp cypress/support/windows/run-os.cmd node_modules/.bin
cp cypress/support/windows/run-script-os node_modules/.bin
cp cypress/support/windows/run-script-os.cmd node_modules/.bin

echo 'INFO: Patch script completed!'