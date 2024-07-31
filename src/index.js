import dontenv from "dotenv"

import connectDB from "./db/indexdb.js";

dontenv.config({
    path:'./env'
})



connectDB();

















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