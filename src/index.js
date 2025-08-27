// require('dotenv').config({path: './env'})
import { DB_NAME } from "./constants.js";
import mongoose from "mongoose";
import connectDB from "./db/index.js"
import dotenv from 'dotenv'
connectDB()
 dotenv.config({
    path:'./env'
 })

 connectDB().then(()=>{
   app.listen(process.env.PORT || 8000,()=>{
      console.log(`Server is running at port:${process.env.PORT}`);
   });
    app.on("error",(error)=>{
       console.log("Error",error);
       throw error;
   })
 })
 .catch((err)=>{
   console.log("Mongo db connection failed!!!",err);
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