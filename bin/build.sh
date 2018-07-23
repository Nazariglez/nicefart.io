#!/usr/bin/env bash

echo "";
echo "Total Commits: ";
npm run count-commits | grep [0-9]

echo "";
npm run count-loc

echo "";
echo "Building production files:";
#echo "";
#echo "Building server...";
#NODE_ENV=production webpack --config webpack.server.config.js --progress --inline --colors -p

sh ./bin/client.sh
sh ./bin/go.sh $1

echo "";
echo "Moving servers.json...";
cp ./src/goserver/config.json ./build/config.json

echo "";
echo "Moving Geo DB...";
cp ./src/goserver/GeoLite2-Country.mmdb ./build/GeoLite2-Country.mmdb

echo "";
echo "Moving Views...";
cp -R ./src/goserver/views ./build/views

#sh ./bin/mobile.sh

echo "";
echo "Done!";