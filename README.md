# Node-Project
# Always use try-catch syntax
# Use Async-await
# Database is in another continent
# Bcrypt is used for password hashing 
# Aggeregation pipline used for handling query request and more
# MiddleWare -> if you are going meet me

## This is a middleware that starts just before the saving password
userSchema.pre("save", async function (next) {
    this.password = bcript.hash(this.pasq, 10)
    next( )
})

so whenever the user tries to save the file i will always encrypt the password