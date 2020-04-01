# Stellot Keybase Authorization

Keybase authorization with keybase-bot

### RPC API:

 - _POST_ `/sendToken(Body: { username, requiredTeam })` - generate JWT token and send to username. 
  if requiredTeam specified, then ensure that username is membership of such team
 - _GET_ `/getUsername(Header: { Authorization: 'Bearer token'})` - Verify token from Authorization header, if valid, then return subject username.
 - _POST_ `/joinTeam(Body: { team })` - Join team, or at least request access. Do it once per voting creation.
