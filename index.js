import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
dotenv.config()

const server = express()
server.use(cors())
server.use(express.json())

const mongoClient = new MongoClient(process.env.MONGO_URI)

let db;
mongoClient.connect().then(() => {
    db = mongoClient.db('batepapo-uol')
})






server.listen(5000)