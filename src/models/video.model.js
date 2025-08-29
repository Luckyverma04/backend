import mongoose,{Schema} from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'



const videoSchema = new Schema({
videoFile:{
    type:String,
    required:true,

},
thumbnail:{
    type:String,
    required:true,
},
title:{
     type:String,
    required:true,
},
discription:{
     type:String,
    required:true,
    minlength:[20,"You have to write atleast 20 words"],
    maxlength:[400, "Description cannot exceed 400 characters"]
},
duration:{
     type:Number,
    required:true,
},
views:{
    type:Number,
    default:0,

},
isPublished:{
 type: Boolean,
 default:true,
},
owner:{
    type:Schema.Types.ObjectId,
    ref:"User",

}
},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video",videoSchema)