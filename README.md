# Node-Project
# Always use try-catch syntax
# Use Async-await
# Database is in another continent
# Bcrypt is used for password hashing 
# Aggeregation pipline used for handling query request and more
# MiddleWare -> if you are going meet me
# For using Multer :-
## first -> configure it 
## second -> simply import wherever you need to use it
## multer is used just before the execution of any method

## This is a middleware that starts just before the saving password
userSchema.pre("save", async function (next) {
    this.password = bcript.hash(this.pasq, 10)
    next( )
})

so whenever the user tries to save the file i will always encrypt the password

The some() method checks if any array elements pass a test (provided as a callback function)
When to Use some():--
You would typically use some() when you need to answer a "yes/no" question about whether any element in an array meets a certain criteria

the trim() method is used to remove whitespace from both ends of a string