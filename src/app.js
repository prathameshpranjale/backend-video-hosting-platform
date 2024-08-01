import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
// for json data
app.use(express.json({limit:"16kb"}))

// for url data 
app.use(express.urlencoded({limit:"16kb"}))

// for storing assets
app.use(express.static("public"))

app.use(cookieParser())

export{app}