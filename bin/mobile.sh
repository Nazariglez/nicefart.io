#!/usr/bin/env bash

echo "";
echo "Building mobile...";
rm -R ./src/mobile/www/assets

go run ./src/goserver/helpers/generateskins.go

if [ "$1" == "dev" ]
then
MOBILE=true webpack --config webpack.config.js --progress --colors
else
MOBILE=true NODE_ENV=production webpack --config webpack.config.js --progress --colors -p
fi

echo "";
echo "Moving assets...";
cp -R ./src/client/assets ./src/mobile/www/assets
