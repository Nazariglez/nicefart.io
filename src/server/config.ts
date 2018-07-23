let argv:ArgvInterface = {};

process.argv.forEach(function (val:string, index, array) {
  if(index >= 2 && val.indexOf("=")){
    const [name, value] = val.split("=");
    argv[name] = parseInt(value);
  }
});

const config = {
  server: {
    port: argv.port || 5000,
    games: argv.games || 1,
    players: argv.players || 200,
  }
};

export default config;

export interface ArgvInterface {
  port?:number;
  games?:number;
  players?:number;
}
