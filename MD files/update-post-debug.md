# TypeError: Cannot destructure property 'description' of 'req.body' as it is undefined.

    🔍 Root Cause:
    You're sending the data as multipart/form-data (because you're uploading a file), but your Express app doesn't have middleware to parse req.body for multipart forms.

    That’s why req.body is undefined.

    We got this error because we didn't used multer middleware for file handling

# file name must match
```js
    router.route("/tweets/:tweetId").patch( // <- this tweetId should be same as used in controller
  jwtVerify,
  upload.single("tweetPost"), // <- this name should be same as used in controller
  updateTweet
);

```