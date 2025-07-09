# req.body is undefined 
    mostly because of app.js 
    
```js
// configuration for accepting json file -> Accept JSON bodies (like from Postman)
app.use(express.json({ limit: '20kb' }))

// // configuration for URL -> Accept form-encoded data (like from HTML forms)
app.use(express.urlencoded({ extended: true, limit: "16mb" }))
```

# cannot destructure property
    Ah, this clears it up! You're sending the request body using `form-data` (like from Postman or an HTML form), but you're only parsing JSON in your Express app.

---

## ❌ Why this error is happening

You're destructuring `content` from `req.body`:

```js
const { content } = req.body;
```

But `req.body` is `undefined` — because you're sending data as `form-data`, **not JSON**, and Express doesn't automatically parse `form-data`.

---

## ✅ Solution: Use `multer` middleware for `multipart/form-data`

When sending data as `form-data`, you need to use the [`multer`](https://www.npmjs.com/package/multer) middleware, because Express **doesn’t support `multipart/form-data` natively**.

---

### ✅ Step-by-step Fix:

### 1. **Install multer** (if not already)

```bash
npm install multer
```

---

### 2. **Set up multer middleware**

In a file like `middlewares/multer.middleware.js`:

```js
import multer from 'multer';

const storage = multer.memoryStorage(); // or use diskStorage if uploading files

export const upload = multer({ storage });
```

---

### 3. **Apply multer to your comment route**

In your router file (`comment.routes.js`):

```js
import { upload } from '../middlewares/multer.middleware.js';

router
  .route('/comments/:videoId')
  .get(jwtVerify, getVideoComments)
  .post(jwtVerify, upload.none(), addComment); // ✅ Add multer here
```

> `upload.none()` means: accept only text fields from `form-data`, no files.

---

### 4. **Now you can send data from Postman like this:**

* **Method**: POST
* **Body** → `form-data`

  * `Key`: `content`, `Value`: `This is a comment`
  * `Key`: (optional additional fields like `file`, etc.)

Now `req.body` will be populated and your destructure will work fine.

---

### ✅ Bonus: When to use what?

| Request Type            | Needs Middleware | Middleware to Use      |
| ----------------------- | ---------------- | ---------------------- |
| `application/json`      | ✅ Yes            | `express.json()`       |
| `x-www-form-urlencoded` | ✅ Yes            | `express.urlencoded()` |
| `multipart/form-data`   | ✅ Yes            | `multer`               |

---

Let me know if you're also uploading files (images, avatars, etc.) — I can guide you with `multer.diskStorage()` + folder handling.


# object typeCast   
    this issue was due to duplicate content schema on Comment Model
