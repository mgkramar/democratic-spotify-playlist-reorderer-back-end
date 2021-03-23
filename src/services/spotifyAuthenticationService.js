const authenticatedUsers = require('../repositories/authenticatedUsers')

const SpotifyClientWrapper = require('../clients/SpotifyClientWrapper')

const TEN_MINUTES_MS = 600 * 1000

const credentials = {
  redirectUri: process.env.SPOTIFY_CALLBACK,
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
}

const scopes = [
  'user-read-private',
  'user-read-playback-state',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private'
]

const state = null

async function authenticate (code) {
  const spotifyApi = new SpotifyClientWrapper(credentials)
  const accessData = await spotifyApi.authenticate(code)

  const expirationTime = new Date(Date.now() + accessData.expires_in * 1000 - TEN_MINUTES_MS).toISOString()

  const authenticatedUser = {
    accessToken: accessData.access_token,
    refreshToken: accessData.refresh_token,
    expirationTime: expirationTime
  }

  authenticatedUsers.add(accessData.refresh_token, authenticatedUser)
  return authenticatedUser
}

function createAuthorizeURL () {
  const spotifyApi = new SpotifyClientWrapper(credentials)
  return spotifyApi.createAuthorizeURL(scopes, state)
}

function provideAuthenticatedClient (refreshToken) {
  let authenticatedUser = authenticatedUsers.get(refreshToken)
  if (Date.now() >= (new Date(authenticatedUser.expirationTime).getTime())) {
    const spotifyApiClient = new SpotifyClientWrapper(authenticatedUser)
    authenticatedUser = spotifyApiClient.refreshToken()
    authenticatedUsers.add(authenticatedUser.refreshToken, authenticatedUser)
  }
  return new SpotifyClientWrapper(authenticatedUser)
}

module.exports = {
  authenticate,
  createAuthorizeURL,
  provideAuthenticatedClient
}
