# 🔍 Why thumbnail[0] and not thumbnail[1]?
    Even though you defined two different fields (video and thumbnail)    in     upload.fields(...), **they are treated as separate named   arrays, not as     elements of a single array.

```js
req.files = {
video: [ { path: "path/to/video.mp4", ... } ],        // index only
thumbnail: [ { path: "path/to/thumbnail.jpg", ... } ] // index only
}
Each field (like video or thumbnail) is an array of files, if    maxCount: 1.
```

# 1. MulterError: Unexpected field
    because the field names in your Postman (or frontend) do not match the names you've defined in your Multer configuration.

# 2. Error: ENOENT: no such file or directory, open 'C:\Users\ASUS\Desktop\Rohit\Node Project\public\temp\1751280788051-fortuner.mp4'
    You're deleting the file (fs.unlinkSync(...)) before Cloudinary is actually done reading it.

    Even though you're using await with cloudinary.uploader.upload_large(...), internally, Cloudinary creates a read stream to read the file from disk — and if you delete the file too early, it throws:

## replaced this
```js
const response = await cloudinary.uploader.upload_large(localFilePath, { resource_type: "video" });
fs.unlinkSync(localFilePath); // ❌ Happens too soon
```
## with this
```js
const response = await new Promise((resolve, reject) => {
  cloudinary.uploader.upload_large(
    localFilePath,
    { resource_type: "video" },
    (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    }
  );
});

console.log("Video Uploaded: ", response.secure_url);

// ✅ Only delete after full success
if (fs.existsSync(localFilePath)) {
  fs.unlinkSync(localFilePath);
  console.log("File Unlinked");
}
```
