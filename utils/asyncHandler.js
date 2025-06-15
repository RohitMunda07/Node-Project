const asyncHandler = (requestHandler) => {
    // this is another function just inside the parent function
    (req, res, next) => {
        Promise.resolve(() => {
            requestHandler(req, res, next) // if all good simply call the passed function
        }).catch((err) => {
            next(err) // raising a flag for rejected promise
        })
    }
}


export { asyncHandler }














// const asyncHandler = () => { }
// const asyncHandler = (funct) => { () => { } }
// const asyncHandler = (funct) => async () => { }

// const asyncHandler = (func) => async (errors, req, res, next) => {
//     try {
//         await func(req, res, next) // calling the passed as parameter function
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }