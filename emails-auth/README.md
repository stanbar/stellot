# Stellot Emails Authentication

Email authentication with auth@stellot.com

### RPC API:

 - _POST_ `/sendToken(Body: { username })` - generate JWT token and send to email. 
 - _GET_ `/getUsername(Header: { Authorization: 'Bearer token'})` - Verify token from Authorization header, if valid, then return subject username.
