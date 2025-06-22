# order miss match in app.js or server.js
We were executing the route before pasring the <b> json() </b> or <b> urlencoded </b>
    |-> causing undefined issue while destructuring the { userName, email, password } form req.body
    |-> we learn about optional chaining eg:- req.body || {}

# Argument unexpected error
At this line ".cookie("refreshToken: ", refreshToken, options)"
we used colon and space

# TypeError: Converting circular structure to JSON
    --> starting at object with constructor 'MongoClient'
    |     property 's' -> object with constructor 'Object'
    |     property 'sessionPool' -> object with constructor 'ServerSessionPool'
    --- property 'client' closes the circle
    at JSON.stringify (<anonymous>)
    at stringify (C:\Users\ASUS\Desktop\Rohit\Node Project\node_modules\express\lib\response.js:1020:12)
    at ServerResponse.json (C:\Users\ASUS\Desktop\Rohit\Node Project\node_modules\express\lib\response.js:243:14)
    at file:///C:/Users/ASUS/Desktop/Rohit/Node%20Project/controllers/user.controller.js:160:10

We faced this because we were not using await while communication with database