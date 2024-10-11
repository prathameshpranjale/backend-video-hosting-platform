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
import healthcheckRouter from "./routes/healthcheck.routes.js"
import videoRouter from "./routes/video.routes.js"
import CommentRouter from "./routes/comment.routes.js" 
// routes declaration
// we can just check here    console.log('Route Hit!!!!!',req.path);
// usr and health check done 
app.use('/api/v1/users',(req,res,next)=>{next();},userRouter);
app.use('/api/v1/healthcheck', healthcheckRouter);
app.use('/api/v1/videos',(req,res,next)=>{next();},videoRouter);
app.use('/api/v1/comments',(req,res,next)=>{

    console.log('Route hit!!', req.path);
    next();
},CommentRouter);




// http://localhost:8000/api/v1/users/register
export{app}