import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';


const UserSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        index:true,
    },
    avatar:{
        type:String, // cloudinary url
        required:true,
    },
    coverImage:{
        type:String,
    },
    refreshToken:{
        type:String,
    },
    password:{
        type:String,
        required:true,
    },
    watchHistory:[
        {
            type:Schema.type.ObjectId,
            ref:"Video",
        }
    ]

},
{
    timestamps:true
}
)

//this middlware function tends to do some pre functionality befor eany action to take place
// in this case if we want to save our user data , it will execute this pre function to encrypt tht password before saving the details
UserSchema.pre("save" , async function(next){
    if(!this.isModified("password")) return next();


    //the bcrypt function takes two parameters oje is the thing that needs to be hashed and other is the salt value
    this.password=bcrypt.hash(this.password , 10);
    next();
} )


//we can alos create our own method , here in this case we will create the method to check whetehr the password entered is correect or not
UserSchema.methods.isCorrectPasswordasync =async function(password){
  //bcrypt compare function will check the whether is password is correct or not
  //compare(original password, encrypted password)
  return await bcrypt.compare(password, this.password);
}

//add token by jwt , by creating our own method

UserSchema.methods.createAccessToken=function(){
    //the sign method takes two parameters the payload and the access token
          return jwt.sign({
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullname
          } , process.env.ACCESS_TOKEN_SECRET ,{
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
          })
}

UserSchema.methods.generateRefreshToken=function(){
    return jwt.sign({
        _id:this._id
        
      } , process.env.REFRESH_TOKEN_SECRET ,{
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
      })
}
export const User=mongoose.model('User' , UserSchema);