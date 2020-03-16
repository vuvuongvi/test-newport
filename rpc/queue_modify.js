const amqp = require('amqplib');
const amqpCon = amqp.connect('amqp://localhost');
const uuid = require('uuid/v4')
async function modifyQueue(name, nameChange) {
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
                    name: name,
                    nameChange: nameChange,
                    command: 'modify'
                }]
                ch.sendToQueue(queue, new Buffer(JSON.stringify(content)), {
                    correlationId: corr,
                    replyTo: q.queue,
                });

                console.log(`Sent ${content}`);

                ch.consume(q.queue, (msg) => {
                    const result = msg.content.toString();
                    console.log(`Receive ${result}`)
                });
            });
    })
}
module.exports = modifyQueue