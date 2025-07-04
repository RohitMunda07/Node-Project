# Error: Unauthorized Request and "jwt malformed(token = undefined or improper Body)"
    at file:///C:/Users/ASUS/Desktop/Rohit/Node%20Project/middlewares/auth.middleware.js:26:15
    at file:///C:/Users/ASUS/Desktop/Rohit/Node%20Project/utils/asyncHandler.js:4:25
    at Layer.handleRequest (C:\Users\ASUS\Desktop\Rohit\Node Project\node_modules\router\lib\layer.js:152:17)
    at next (C:\Users\ASUS\Desktop\Rohit\Node Project\node_modules\router\lib\route.js:157:13)
    at Route.dispatch (C:\Users\ASUS\Desktop\Rohit\Node Project\node_modules\router\lib\route.js:117:3)
    at handle (C:\Users\ASUS\Desktop\Rohit\Node Project\node_modules\router\index.js:435:11)
    at Layer.handleRequest (C:\Users\ASUS\Desktop\Rohit\Node Project\node_modules\router\lib\layer.js:152:17)
    at C:\Users\ASUS\Desktop\Rohit\Node Project\node_modules\router\index.js:295:15
    at processParams (C:\Users\ASUS\Desktop\Rohit\Node Project\node_modules\router\index.js:582:12)
    at next (C:\Users\ASUS\Desktop\Rohit\Node Project\node_modules\router\index.js:291:5)

-> this error arise because we are not using the await while generating the access token 
which results -> function generateAccessTokenAndRefreshToken run and also generated the accesToken and refreshToken
but since we were not using await the value did now stored and the code move further and assigning the variables to undefined

# New things learned
1. findOneAndUpdate vs findByIdAndUpdate
When updating based on _id, prefer using:
await User.findByIdAndUpdate(id, updates, options)
It's clearer and optimized when using the _id directly.

2. $unset vs $set: { field: undefined }
Use $unset: { field: "" } to completely remove a field from a document in MongoDB.
Using $set: { field: undefined } keeps the field but assigns it undefined, which:
Still counts as a field
Can interfere with schema validations or logic

3. Cookie Options in Express
secure: true → required for HTTPS.
🔁 For local development, set secure: false.
sameSite: 'None' → needed when your frontend and backend are on different domains (e.g., localhost:3000 and localhost:8000).
const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'None'
};