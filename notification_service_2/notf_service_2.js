const amqp = require("amqplib/callback_api");
const rabbitMQURL = 'amqps://rsgvdwjm:AywPeQz1yhXRcqAP0mPUpbDcyQMYkGtL@puffin.rmq2.cloudamqp.com/rsgvdwjm';

amqp.connect(rabbitMQURL, function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }
    const exchange1 = "updateOrder";

    channel.assertExchange(exchange1, "topic", {
      durable: false,
    });

    const exchange2 = "placeOrder";

    channel.assertExchange(exchange2, "fanout", {
      durable: false,
    });

    channel.assertQueue(
      "",
      {
        exclusive: true,
      },
      function (error2, q) {
        if (error2) {
          throw error2;
        }
        console.log(" [*] Waiting for logs. To exit press CTRL+C");
        channel.bindQueue(q.queue, exchange1, "update");
        channel.bindQueue(q.queue, exchange2, "");

        channel.consume(
          q.queue,
          function (msg) {
            console.log(
              " [x] %s:'%s'",
              msg.fields.routingKey,
              msg.content.toString()
            );
          },
          {
            noAck: true,
          }
        );
      }
    );
  });
});
