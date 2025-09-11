# URL Shortener Service
## Overview
This project is a URL shortener service built with Node.js. It allows users to create shortened versions of long URLs, which can be easily shared and tracked.

## Features
- URL Shortening: Convert long URLs into short, easy-to-share links.
- Secure Password Hashing: Uses bcrypt for secure password storage.
- RESTful API: Provides endpoints for URL creation, redirection, and analytics.
- Analytics Tracking: Track the number of times a shortened URL is accessed.

## Installation
Clone the repository:

```
git clone https://github.com/yourusername/url-shortener.git
```
Navigate to the project directory:
```
cd url-shortener
```
Install dependencies:
```
npm install
```
Usage
Start the server:
```
npm run autoreload
```
Access the service at http://localhost:3000 or customize port in .env file <br>
## API Endpoints 
### Create a shortened URL.
`Post /api/shorten` <br><br>
**Example request**
```
{
  "fullUrl": "https://example.com",
  "exp": "<custom_expiration_date>",
  "customDir": "example_code"
}
```

headers: 
```
Authorization: Bearer <your_token_here>
```

**NB: all the parameters except for fullUrl don't work without authentication**

**Example response**
```
{
  "status": 200,
  "shortUrl": "https://yourdomain.com/short123"
}
```

### Sign in to get api key
`Post /auth/signIn`

**Example request**
```
{
  "username": "user123",
  "password": "password123"
}
```

**Example response**
```
{
  "status": 200,
  "token": "your_bearer_token_here"
}
```


