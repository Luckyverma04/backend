import express from 'express'

import cookieparser from 'cookie-parser'
import cors from 'cors'
 const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit:'16kb'}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))

app.use(cookieparser())

// routes
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import commentRouter from'./routes/comment.routes.js'
// import { deleteVideo } from './controllers/video.controllers.js'
app.get("/", (req, res) => {
    res.send("Welcome to my API server!");
});

// route declaration
app.use("/api/v1/users",userRouter)
app.use("/api/v1/videos",videoRouter)
// app.delete("/api/v1/videos",deleteVideo)
app.use("/api/v1/comments",commentRouter)
//http://localhost:4000/api/v1/users/register
export{app}