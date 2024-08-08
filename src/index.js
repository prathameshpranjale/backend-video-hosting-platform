import dontenv from "dotenv"
import express from "express";
import connectDB from "./db/indexdb.js";
import { app } from "./app.js";

dontenv.config({
    path:'./.env'
})



// error handler for app


// app.on("error",(error)=>{
//     // listen for errors emitted by the express app and logs them 
//     console.log("ERROR",error);
// })
const PORT = process.env.PORT || 8000;
connectDB()
.then(()=>{
    app.listen(PORT, ()=>{
        console.log(`Server is running at port : ${process.env.PORT} yoooo`);
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