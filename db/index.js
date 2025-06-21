import mongoose from "mongoose";
import { DB_NAME } from "../src/constant.js";

const connectDB = async () => {

    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`)

        console.log(connectionInstance.connection.host);
        console.log(`\n MongoDB Connect Successfully!! DB HOST: ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.error("ERROR Connecting DB: ", error)
        process.exit(1)
    }
}

export default connectDB