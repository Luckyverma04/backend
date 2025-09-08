import mongoose from "mongoose";

const tweetSchema = new mongoose.Schema({
    content:{
        type:String,
        required:true,
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
    likesCount:{
        type:Number,
        default:0,
    },
},{timestamps:true})
export const Tweet = mongoose.model("Tweet",tweetSchema)