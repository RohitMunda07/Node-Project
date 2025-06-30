import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Ensure temp directory exists
// const TEMP_DIR = './public/temp';
// if (!fs.existsSync(TEMP_DIR)) {
//   fs.mkdirSync(TEMP_DIR, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, TEMP_DIR);
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     const uniqueName = `${file.fieldname}-${Date.now()}${ext}`;
//     console.log("Saving file:", file.originalname);
//     cb(null, uniqueName);
//   }
// });

// export const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
// });








// import multer from 'multer'

const TEMP_DIR = './public/temp';
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TEMP_DIR)
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname
    console.log("My file :", file);
    cb(null, uniqueName)
}

})

export const upload = multer({
  storage
})
