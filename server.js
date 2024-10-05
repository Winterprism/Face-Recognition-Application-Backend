import express from 'express';
import bcrypt from 'bcrypt-nodejs';
import cors from 'cors';
import knex from 'knex';

import register from "./controllers/register.js";
import signin from "./controllers/signin.js";
import profile from "./controllers/profile.js";
import image from "./controllers/image.js";
import fetch from 'node-fetch';

const db = knex({
    client: 'pg',
    connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        host: process.env.DATABASE_HOSTNAME,
        port: 5432,
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_DB,
    }
});


const corsOptions = {
    origin: ['*'],
    methods: '*', 
    allowedHeaders: "Content-Type, Authorization",
    credentials: true,
    optionsSuccessStatus: 200
};

const app = express();
app.use(express.json());  
app.use(cors(corsOptions));


app.get('/', (req, res)=> {res.send('it is working!')})

app.post('/signin', (req, res) => {signin(req, res, db, bcrypt)})

app.post('/register', (req, res) => {register(req, res, db, bcrypt)})

app.get('/profile/:id', (req, res) => {profile(req, res, db)})

app.put('/image', (req, res) => {image(req, res, db)})


const returnClarifaiRequestOptions = (imageUrl) => {
    const PAT = '0d50629957d449b8bdc3d4eb809b6f00';
    const USER_ID = '9vitl3i7ne10';
    const APP_ID = 'Face-Recognition';
    const MODEL_ID = 'face-detection';
    const IMAGE_URL = imageUrl;

    const raw = JSON.stringify({
        "user_app_id": {
            "user_id": USER_ID,
            "app_id": APP_ID
        },
        "inputs": [
            {
                "data": {
                    "image": {
                        "url": IMAGE_URL
                    }
                }
            }
        ]
    });

    const requestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Key ' + PAT
        },
        body: raw
    };
    return requestOptions;
};

app.post('/clarifai', (req, res) => {
    fetch("https://api.clarifai.com/v2/models/face-detection/outputs", returnClarifaiRequestOptions(req.body.imageUrl))
        .then(response => response.json())
        .then(data => res.json(data))
        .catch(err => res.status(400).json('Unable to work with Clarifai API'));
});


app.listen(3000, ()=>{
    console.log('app is running');
})