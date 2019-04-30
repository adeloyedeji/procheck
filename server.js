const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');

const app = express();
const props = {};

props.db = dbConnect();

var dbInterval = null;

function stopDBRetry() {
    clearInterval(dbInterval);
}

async function dbConnect() {
    let state = 0;
    await mongoose.connect(config.database, (err) => {
        if(err) {
            // console.error(err);
        } else {
            console.log(`Connected to database: ${config.database}`);
            state = 1;
        }
    }).then(data => {
        console.log(`DB Connection Success.`);
    }).catch(err => {
        console.log(err.message);
    });
    return state;
}

// var db = mongoose.connection;

// db.on('error', console.error.bind(console, 'connection error:'));
// db.on('error', function(err) {
//     console.error('Unfortunately! we could not connect to the database server at the moment.');
// })
// db.once('open', function() {
//     console.info('We are now connected to the database server')
// });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(cors());

app.get('/', (req, resp, next) => {
    resp.json({
        user: 'Adeloye Adedeji'
    }); 
});

if(props.db == 0) {
    dbInterval = setInterval(() => {
        props.db = dbConnect();
        if(props.db == 1) {
            connectRoutes();
        }
    }, 2000);
} else {
    stopDBRetry(); 
    connectRoutes();
}

function connectRoutes() {
    const userRoutes = require('./routes/user');
    const projectRoutes = require('./routes/project');
    const profileRoutes = require('./routes/profile');
    const plagiarismRoutes = require('./routes/plagiarism');
    
    app.use('/accounts', userRoutes);
    app.use('/projects', projectRoutes);
    app.use('/plagiarism', plagiarismRoutes);
    app.use('/services', profileRoutes);
    
    app.listen(config.port, (err) => {
        console.log(`All Routes Loaded on Host ${config.host}`);
    })
}