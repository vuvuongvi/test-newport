
const amqp = require('amqplib');
const uuid = require('uuid/v4')
const amqpCon = amqp.connect('amqp://localhost');
async function addQueue(data) {
    amqpCon
        .then(conn => conn.createChannel())
        .then((ch) => {
            ch.assertQueue('', {
                exclusive: true,
                expires: 5000,
                autodelete: true,
            })
            .then((q) => {
                const corr = uuid();
                const queue = 'test_pub_sub_rpc';
                const content = [{
                    name: data,
                    command: 'add'
                }]
                ch.sendToQueue(queue, new Buffer(JSON.stringify(content)), {
                  correlationId: corr,
                  replyTo: q.queue,
                });
                
                console.log(`Sent ${content}`);
                ch.consume(q.queue, (msg) => {
                  const result = msg.content.toString();
                  console.log(`Receive ${result}`)
                  return result;
                });
              });
        })
}
module.exports = addQueue