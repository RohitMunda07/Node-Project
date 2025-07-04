#  File Upload Access:

    upload.single("fieldName") → req.file.path (no array)
    upload.array("fieldName") → req.files[0].path (array of files)
    upload.fields([...]) → req.files.fieldName[0].path (object with arrays)

# Flow for Getting all tweets
    1. $lookup  (join user details)
    2. $unwind  (flatten joined array)
    3. optional $match if filters present
    4. $addFields (likes/views count)
    5. $project  (select only required fields)
    6. $sort
    7. $skip + $limit (pagination)
