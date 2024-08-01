import dontenv from "dotenv"
import express from "express";
import connectDB from "./db/indexdb.js";

dontenv.config({
    path:'./env'
})

// adding error handling 
const app = express();

// error handler for app


app.on("error",(error)=>{
    // listen for errors emitted by the express app and logs them 
    console.log("ERROR",error);
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("Mongo db connection failed !!!!!!!!!!",err);
})
















// iffy function
// (async()=>{

//     try{
//     await mongoose.connect(`${process.env.MONGODB_URI}`/`${DB_NAME}`)

//     app.on("error",(error)=>{
//         console.log("ERROR");
//         throw error
//     })

//     app.listen(process.env.PORT,()=>{
//         console.log(`App is listening on Port ${process.env.PORT}`);
//     })
//     }
//     catch(error){
//         console.log("ERROR : ",error);
//     }
// })()