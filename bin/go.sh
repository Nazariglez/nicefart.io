echo "";
echo "Building goserver...";
if [ "$1" == "darwin" ]
then
  echo "- Darwin OS -";
  go build -o ./build/game ./src/goserver/main.go
else
  echo "- Linux OS -";
  GOOS=linux GOARCH=amd64 go build -o ./build/game ./src/goserver/main.go
fi

chmod +x ./buld/game