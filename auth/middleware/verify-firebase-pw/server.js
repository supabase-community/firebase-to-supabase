const VERSION = '7';
const FirebaseScryptLib = require('firebase-scrypt');
const http = require('http');
const app = require("restana")(); // more efficient than express.js
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;
const firebaseParameters = {
  memCost: process.env.MEMCOST,
  rounds: process.env.ROUDNS, 
  saltSeparator: process.env.SALTSEPARATOR, 
  signerKey: process.env.SIGNERKEY 
}
const scrypt = new FirebaseScryptLib.FirebaseScrypt(firebaseParameters);

app.get(["/", "/:salt/:hash/:password"], (req, res) => {
  greeting = `verify-firebase-pw v${VERSION}`;
  salt = req.params.salt;
  hash = req.params.hash;
  password = req.params.password;
  if (salt && password && hash) {
    scrypt.verify(password, salt, hash)
    .then((isValid) => {
      res.statusCode = 200;
      res.send(isValid ? 'valid' : 'invalid');
    }).catch((err) => {
      res.statusCode = 400;
      res.send(JSON.stringify(err));
    });
  } else {
    res.send(greeting);
  }
});

app.post("/", (req, res) => {
  greeting = `verify-firebase-pw v${VERSION}`;
  salt = req.body.salt;
  hash = req.body.hash;
  password = req.body.password;
  if (salt && password && hash) {
    scrypt.verify(password, salt, hash)
    .then((isValid) => {
      res.statusCode = 200;
      res.send(isValid ? 'valid' : 'invalid');
    }).catch((err) => {
      res.statusCode = 400;
      res.send(JSON.stringify(err));
    });
  } else {
    res.send(greeting);
  }
});

http.createServer(app).listen(port, '0.0.0.0', function () {
  console.log(`verify-firebase-pw app listening on port ${port}!`);
})