electron-packager . Cereal --platform=darwin --arch=x64 --overwrite --icon=icon.icns --asar --ignore="setup"

npm install --global --production windows-build-tools
npm install node-gyp
node_modules\.bin\electron-rebuild -w -f serialport