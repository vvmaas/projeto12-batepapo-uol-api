import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import dayjs from 'dayjs'
import joi from 'joi'
import Joi from 'joi'
dotenv.config()

const server = express()
server.use(cors())
server.use(express.json())

const mongoClient = new MongoClient(process.env.MONGO_URI)

let db;
mongoClient.connect().then(() => {
    db = mongoClient.db('batepapo-uol')
})

const messageSchema = joi.object({
    to: Joi.string().min(1).required(),
    text: Joi.string().min(1).required(),
    type: Joi.string().valid('message', 'private_message').required()
})

const participantSchema = joi.object({
    name: Joi.string().min(1).required()
})

setInterval(async () => {
    const list = await db.collection('participants').find().toArray()
    list.map(user => {
        if(user.lastStatus < Date.now()-10000){
             db.collection('participants').deleteOne({name: user.name})
             db.collection('messages').insertOne({
                from: user.name,
                to: "Todos",
                text: "sai da sala...",
                type: 'status',
                time: `${dayjs().hour()}:${dayjs().minute()}:${dayjs().second()}`
            })
        }
    }
    )
}, 15000)

server.post("/participants", async (req,res) => {
    const { name } = req.body

    const {error, value} = participantSchema.validate(req.body)

    if(error){
        return res.sendStatus(422)
    }

    const nameTaken = await db.collection('participants').findOne({name: name})

    if(nameTaken){
        return res.sendStatus(409)
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

    const {error, value} = messageSchema.validate(req.body)

    if(error){
        return res.sendStatus(422)
    }

    const isHere = await db.collection('participants').findOne({name: user})

    if(!isHere){
        return res.sendStatus(422)
    }

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

server.post("/status", async (req,res) => {
    const user = req.headers.user

    try {
        const isHere = await db.collection('participants').find({name: user})

        if(!isHere){
            res.sendStatus(404)
        } else {
            await db.collection('participants').updateOne({name: user},
                {
                    $set: {lastStatus: Date.now()}
                })
        }
        res.sendStatus(200)
    } catch (err) {
        res.sendStatus(500)
    }
})

server.listen(5000, () => {
    console.log("On at 5000");
})