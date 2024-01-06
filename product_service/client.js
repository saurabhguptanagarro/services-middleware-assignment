const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PROTO_PATH = __dirname + "/../protos/order.proto";

const parseArgs = require("minimist");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const order_proto = grpc.loadPackageDefinition(packageDefinition).order;

const argv = parseArgs(process.argv.slice(2), {
  string: "target",
});
let target;
if (argv.target) {
  target = argv.target;
} else {
  target = "localhost:50051";
}
const client = new order_proto.Order(target, grpc.credentials.createInsecure());

const port = 3000;

app.post("/placeOrder", function (req, res) {
  client.placeOrder(req.body, function (err, response) {
    res.status(response.orderId ? 200 : 400).send(response);
  });
});

app.patch("/updateOrder", function (req, res) {
  client.updateOrder(req.body, function (err, response) {
    res.status(response.orderId ? 200 : 404).send(response);
  });
});

// start the server
app.listen(port);
console.log("Client Server started! At http://localhost:" + port);
