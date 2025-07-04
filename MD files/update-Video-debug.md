# TypeError: Cannot read properties of undefined (reading 'trim')
    We got this error because we were using post instead of using patch for data update

# Solution
    Change post -> patch

```js
// debug code
console.log("req.body:", req.body) // Debug log
console.log("req.file:", req.file) // Debug log (if file uploaded)
console.log("req.params:", req.params) // Debug log 
```

    also we implemented
```js
    const video = await Video.findByIdAndUpdate(
        videoId, 
        updateData,
        {new: true, runValidators: true} // <-- for getting updated datas
    )
```

# New things we Learn
## req.param VS res.query
    req.param -> we are accessing only the url
    req.query -> we are accessing the url but also we are passing few arguments like(page, limit, query, id)

## form-data VS json(raw -> json)
    If we are sending the data (text type like title, description etc)-> use json
    but,
    If we are sending the data (along with the image or video) -> use form-data


# 🔴 Critical Issues:

    Line 3: const { title, description, thumbnail, video } = req.body

    Problem: You're destructuring thumbnail and video from req.body, but they come from req.files
    Fix: Remove thumbnail, video from destructuring

    handle the undefine case earlier i was handling only the empty string part

# Learning 
    for deletion use existing video url form database
    for upading use local file passed by user -> req.files(multer)

# 🟢 Flow Analysis:
    Your flow is correct:
    
    ✅ Get data from request
    ✅ Validate videoId
    ✅ Check files exist
    ✅ Extract file paths
    ✅ Find existing video
    ✅ Validate text fields
    ✅ Delete old files → Upload new files
    ✅ Update database
    ✅ Return response