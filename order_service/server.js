const fs = require("fs");
const PROTO_PATH = __dirname + "/../protos/order.proto";
const amqp = require("amqplib/callback_api");

const rabbitMQURL = 'amqps://rsgvdwjm:AywPeQz1yhXRcqAP0mPUpbDcyQMYkGtL@puffin.rmq2.cloudamqp.com/rsgvdwjm';
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

/**
 * Implements the SayHello RPC method.
 */
function placeOrder(call, callback) {
  const products = JSON.parse(fs.readFileSync("db/products.json").toString());
  const orders = JSON.parse(fs.readFileSync("db/orders.json").toString());
  const productIds = products.map((product) => product.id);

  const items = call.request.items;
  let messageToReturn;

  try {
    const itemNotExists = items.some(
      (product) => !productIds.includes(product.productId)
    );

    if (itemNotExists) messageToReturn = { message: "Some item(s) not exists" };
    else {
      const orderId = new Date().getTime();
      orders.push({ orderId, items });
      fs.writeFileSync("db/orders.json", JSON.stringify(orders, null, 2));
      messageToReturn = { orderId, message: "Order successfully placed" };
      sendNotification(messageToReturn, true);
    }
  } catch (err) {
    console.error(err);
  }
  callback(null, messageToReturn);
}

function updateOrder(call, callback) {
  const products = JSON.parse(fs.readFileSync("db/products.json").toString());
  const orders = JSON.parse(fs.readFileSync("db/orders.json").toString());

  const updateRequest = call.request;
  let messageToReturn;

  try {
    const existingOrder = orders.find(
      (order) => order.orderId == updateRequest.orderId
    );

    if (existingOrder) {
      const productIds = products.map((product) => product.id);
      const itemNotExists = updateRequest.items.some(
        (product) => !productIds.includes(product.productId)
      );

      if (itemNotExists)
        messageToReturn = {
          message: "Some item(s) not exists",
        };
      else {
        existingOrder.items = existingOrder.items.concat(updateRequest.items);
        fs.writeFileSync("db/orders.json", JSON.stringify(orders, null, 2));
        messageToReturn = {
          orderId: updateRequest.orderId,
          message: "Order successfully updated",
        };
        sendNotification(messageToReturn);
      }
    } else {
      messageToReturn = { message: "Order does not exists" };
    }
  } catch (err) {
    console.error(err);
  }

  callback(null, messageToReturn);
}

/**
 * Starts an RPC server that receives requests for the Order service
 */
function main() {
  const server = new grpc.Server();
  server.addService(order_proto.Order.service, {
    placeOrder: placeOrder,
    updateOrder: updateOrder,
  });
  server.bindAsync(
    "0.0.0.0:50051",
    grpc.ServerCredentials.createInsecure(),
    () => {
      server.start();
      console.log("Server started! at http://0.0.0.0:50051");
    }
  );
}

main();

function sendNotification(payload, isBroadcast) {
  amqp.connect(rabbitMQURL, function (error0, connection) {
    if (error0) {
      throw error0;
    }
    connection.createChannel(function (error1, channel) {
      if (error1) {
        throw error1;
      }
      const exchange = isBroadcast ? "placeOrder" : "updateOrder";
      const topicKey = "update";
      const msg = JSON.stringify(payload);

      channel.assertExchange(exchange, isBroadcast ? "fanout" : "topic", {
        durable: false,
      });
      channel.publish(exchange, topicKey, Buffer.from(msg));
      console.log(" [x] Sent %s", msg);
    });

    setTimeout(function () {
      connection.close();
    }, 500);
  });
}
