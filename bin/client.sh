#!/usr/bin/env bash

echo "";
echo "Building client...";
rm -R ./build/client
rm -R ./build/views

go run ./src/goserver/helpers/generateskins.go

if [ "$1" == "dev" ]
then
webpack --config webpack.config.js --progress --colors
else
NODE_ENV=production webpack --config webpack.config.js --progress --colors -p
fi

echo "";
echo "Moving assets...";
cp -R ./src/client/assets ./build/client/assets
