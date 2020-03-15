const express = require('express');
const bodyParser = require('body-parser');
const swaggerDocument = require('./swagger');
const swaggerUi = require('swagger-ui-express');
const taskToDoList = require('./db/models/task');
const amqp = require('amqplib/callback_api');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.get('/api/getList', function (req, res) {
    taskToDoList.find({}, function (error, docs) {
        if (error) {
            throw error;
        } else {
            return res.send(docs);
        }
    });
});
app.post('/api/deleteTask', async function (req, res) {
    let obj = {
        id: req.body.id ? req.body.id : '',
        name: req.body.name ? req.body.name : '',
    };
    try {
        await taskToDoList.find({ name: obj.name }).remove().exec();
    } catch (error) {
        throw new Error('Cannot remove task, please check task name again');
    }
});
app.post('/api/addTask', async function (req, res) {
    let obj = {
        id: req.body.id,
        name: req.body.name,
        command: 'add'
    };
    await taskToDoList.update(obj, (error, docs) => {
        if (error) {
            throw error;
        } else {
            res.send(`${docs}`);
        }
    })
});
app.put('/api/modifyTask', async function (req, res) {
    let [name, numberId] = [req.body.name, req.body.id];
    await taskToDoList.findOneAndUpdate({ id: numberId }, { $set: { name: name } }, { new: true }, (error, doc) => {
        if (error) {
            console.error(error)
        } else {
            return res.send(`${docs}`)
        }
    });
});
app.post('/api/searchTask', async function (req, res) {
    let name = req.body.name;
    amqp.connect('amqp://localhost', function (error0, connection) {
        if (error0) {
            throw error0;
        }
        connection.createChannel(function (error1, channel) {
            if (error1) {
                throw error1;
            }
            let queue = 'hello';
            let msg = [{
               name: name,
               command: 'search'
            }];
            channel.assertQueue(queue, {
                durable: false
            });
            console.log(' [x] Awaiting RPC requests');
            return channel.consume(queue, function(msg, error) {
                channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(msg)), {
                    correlationId: msg.properties.correlationId
                });
                amqp.ack(msg);
                console.log(" [x] Sent %s", JSON.stringify(msg));        
            });
        });
    });
});
app.get('/', function (req, res) {
    res.send(`NewPort Test Api`);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
const PORT = 5000;
app.listen(PORT, () => {
    console.log("Server running in PORT" + PORT)
});