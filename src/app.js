import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
// for json data
// .use is syntax for middle wares
app.use(express.json({limit:"16kb"}))

// for url data 
app.use(express.urlencoded({limit:"16kb"}))

// for storing assets
app.use(express.static("public"))

app.use(cookieParser())


// import routes
import userRouter from "./routes/user.routes.js"
 
// routes declaration
app.use('/api/v1/users',(req,res,next)=>{
   
    console.log('Route Hit!!!!!',req.path);
    next();
},userRouter);



// http://localhost:8000/api/v1/users/register
export{app}