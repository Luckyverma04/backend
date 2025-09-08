import mongoose,{Schema} from 'mongoose'

const playlistSchema = new Schema({
   Name:{
    type:String,
    required:true,
    },
    discription:{
    type:String,
    required:true,
    minlength:[20,"You have to write atleast 20 words"],
    },

    videos:[{
        type:Schema.Types.ObjectId,
        ref:"Video",
    }],
   owner:{
        type:Schema.Types.ObjectId,
        ref:"User", 

      },
   },
{timestamps:true})
export const Playlist = mongoose.model("Playlist",playlistSchema)