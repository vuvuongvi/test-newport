const express = require('express');
const bodyParser = require('body-parser');
const swaggerDocument = require('./swagger');
const swaggerUi = require('swagger-ui-express');
const taskToDoList = require('./db/models/task');
const amqp = require('amqplib');
const uuid = require('uuid/v4')
const amqpCon = amqp.connect('amqp://localhost');
const rpcAdd = require('./rpc/queue_add');
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
        name: req.body.name ? req.body.name : '',
    };
    try {
        let deleteTask = await taskToDoList.find({ name: obj.name }).remove().exec();
        return res.send(`${JSON.stringify(deleteTask)}`)
    } catch (error) {
        throw new Error('Cannot remove task, please check task name again');
    }
});
app.post('/api/addTask', async function (req, res) {
    let obj = [{
        name: req.body.name,
        command: 'add'
    }];
    await taskToDoList.update(obj, (error, docs) => {
        if (error) {
            throw error;
        } else {
            await rpcAdd(obj)
            res.send(`${JSON.stringify(docs)}`);
        }
    })
});
app.post('/api/modifyTask', async function (req, res) {
    let [nameCurrently, nameChange] = [req.body.name, req.body.nameChange];
    await taskToDoList.findOneAndUpdate({ name: nameCurrently }, { $set: { name: nameChange } }, { new: true }, (error, doc) => {
        if (error) {
            console.error(error)
        } else {
            return res.send(`${doc}`)
        }
    });
});

app.post('/api/searchTask', async (req, res) => {
    let name = req.body.name;
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
                    command: 'search'
                }]
                ch.sendToQueue(queue, new Buffer(JSON.stringify(content)), {
                  correlationId: corr,
                  replyTo: q.queue,
                });
                
                console.log(`Sent ${content}`);
          
                ch.consume(q.queue, (msg) => {
                  const result = msg.content.toString();
                  console.log(`Receive ${result}`)
                  res.send(`${result}`);
                });
              });
        })
});
app.get('/', function (req, res) {
    res.send(`NewPort Test Api`);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
const PORT = 5000;
app.listen(PORT, () => {
    console.log("Server running in PORT" + PORT)
});