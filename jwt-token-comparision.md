# How JWT Token Comparision works?

1. User sends the encoded JWT (refresh token) to your server (e.g., in a cookie or request body).
2. You verify and decode the token using jwt.verify(token, secret), which gives you the payload (like user ID).
3. You use the payload (e.g., _id) to find the user in your database.
4. You compare the incoming encoded token (the JWT string sent by the user) with the encoded token stored in the database (user.refreshToken).
5. If they match, the token is valid and belongs to that user.

## You never compare the decoded payloads—only the encoded token strings.
The decoded payload is just used to look up the user.