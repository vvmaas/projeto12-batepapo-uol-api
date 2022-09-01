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

    if(name == ""){
        return res.sendStatus(422)
    }

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
        res.sendStatus(500)
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

server.post("/messages", async (req,res) => {
    const {to, text, type} = req.body
    const user  = req.headers.user

    try {
        await db.collection('messages').insertOne({
            from: user,
            to: to,
            text: text,
            type: type,
            time: `${dayjs().hour()}:${dayjs().minute()}:${dayjs().second()}`
        })

        res.sendStatus(201)
    } catch (err) {
        res.sendStatus(500)
    }
})

server.get('/messages', async (req,res) => {
    const user = req.headers.user
    const limit = req.query.limit

    try {
        const messagesRaw = await db.collection("messages").find().toArray();
        const messages = messagesRaw.map(msg => {
            return{
                from: msg.from,
                to: msg.to,
                text: msg.text,
                type: msg.type,
                time: msg.time
            }
        })
        
            const messagesFilter = messages.filter(msg => {
                if(msg.type === "private_message"){
                    return (msg.to === user || msg.from === user || msg.to === 'Todos')
                } else {
                    return true
                }
            })

        if(limit) {
            res.send(messagesFilter.slice(-limit))
        } else {
            res.send(messagesFilter)
        }
    } catch (err) {
        res.sendStatus(500)
    }
})




server.listen(5000, () => {
    console.log("On at 5000");
})