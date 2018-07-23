/**
 * Created by nazarigonzalez on 20/6/16.
 */
import * as net from 'net';

export function checkPort(port, fn) {
  let tester = net.createServer();

  tester.once('error', function (err) {

    if (err.code != 'EADDRINUSE') return fn(err);
    fn(null, false);

  }).once('listening', function() {

    tester.once('close', function() {
      fn(null, true)
    }).close();

  }).listen(port);
}
