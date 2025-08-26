// require('dotenv').config({path: './env'})
import { DB_NAME } from "./constants.js";
import mongoose from "mongoose";
import connectDB from "./db/index.js"
import dotenv from 'dotenv'
connectDB()
 dotenv.config({
    path:'./env'
 })




// import express from'express'
// const app = express()
// ( async()=>{
//     try{
//       await mongoose.connect(`${process.env.MONGODB_URI}/${ DB_NAME}`)
//       app.on("error",()=>{
//         console.log("Error",error);
//         throw error
//     })
//     app.listen(process.env.PORT,()=>{
//         console.log(`App is listening on port ${process.env.PORT}`);
//     })
//     }
//     catch(error){
//         console.log("ERROR:",error)
//         throw err
//     }
// })()