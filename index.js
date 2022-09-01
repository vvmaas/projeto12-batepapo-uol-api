import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import dayjs from 'dayjs'
dotenv.config()

const server = express()
server.use(cors())
server.use(express.json())

const mongoClient = new MongoClient(process.env.MONGO_URI)

let db;
mongoClient.connect().then(() => {
    db = mongoClient.db('batepapo-uol')
})

server.post("/participants", async (req,res) => {
    const { name } = req.body
    try {
        await db.collection('participants').insertOne({
            name: name,
            lastStatus: Date.now()
        })

        await db.collection('messages').insertOne({
            from: name,
            to: "Todos",
            text: "entra na sala...",
            type: 'status',
            time: `${dayjs().hour()}:${dayjs().minute()}:${dayjs().second()}`
        })

        res.sendStatus(201)
    } catch (err) {

    }
})

server.get("/participants", async (req,res) => {
    try{
    const participantsRaw = await db.collection("participants").find().toArray()
    const participants = participantsRaw.map(user => {
        return {
            name: user.name, 
            lastStatus: undefined
        }
    })
    res.send(participants)
    } catch (err) {
        res.sendStatus(500)
    }
})




server.listen(5000)