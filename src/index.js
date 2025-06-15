// require(dotenv).config({ path: './env' })
import { app } from './app.js'
import dotenv from 'dotenv'
import connectDB from "../db/index.js";

dotenv.config({
    path: './env'
})


connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("Error in Communication to DB", error);
        })
        app.listen(process.env.PORT || 8000, () => {
            console.log("App Listening on port: ", process.env.PORT);
        })
    })
    .catch((error) => {
        console.log("DB Connection Error form src/index.js: ", error);

    })




/*
import mongoose from "mongoose";
import { DB_NAME } from "./constant";
import express from "express";

const app = express()

    ; (async () => {
        try {
            await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

            app.on("error", (error) => {
                console.log("Error in Communication to DB", error);

            })

            app.listen(process.env.PORT, () => {
                console.log(`App is Listening on port ${process.env.PORT}`);
            })
        } catch (error) {
            console.error("ERROR: ", error);
            throw error;
        }
    })()
*/