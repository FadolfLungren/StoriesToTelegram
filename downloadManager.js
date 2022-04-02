const Instagram = require('./instagramFetch.js')
const Fs = require('fs')
const Path = require('path')
const dbController = require("./database/database_controller");
const Credentials = require("./credentials.json");

function downloadPosts(ofUser, path) {
  fetchManager(ofUser,'photos', async (userID) => {
    const response = await Instagram.fetchPhotos(userID)
    downloadImages(response, path)
  })
}

function downloadStories(ofUser,ChatId) {
  //console.log("ChatId:" + path)
  return fetchManager(ofUser,'stories', async (userID) => {
    const response = await Instagram.fetchStories(userID,ChatId)
      return downloadImages(response)
  })
}

function downloadHighlightedStories(ofUser, index, path) {
  fetchManager(ofUser,'highlighted stories', async (userID) => {
    const response = await Instagram.fetchHighlightedStories(userID)
    if (index) {
      if (index>0 && index <= response.length) {
        downloadImages(response[index+1], path)
      }
      else {
        console.error('Index mismatch')
      }
    }
    else {
      for (var i=0; i<response.length; i++) {
        downloadImages(response[i], path)
      }
    }
  })
}

function downloadTaggedPhotos(ofUser, path) {
  fetchManager(ofUser,'tagged photos', async (userID) => {
    const response = await Instagram.fetchTaggedPhotos(userID)
    downloadImages(response, path)
  })
}

function downloadFollowers(ofUser) {
  fetchManager(ofUser,'followers', async (userID) => {
    const response = await Instagram.fetchFollowers(userID)
    console.log('=========')
    for (var i=0; i<response.length; i++) {
      console.log(response[i])
    }
    console.log('=========')
    console.log(`Total ${response.length} followers`)
  })
}

function downloadFollowing(ofUser) {
  fetchManager(ofUser,'following', async (userID) => {
    const response = await Instagram.fetchFollowing(userID)
    console.log('=========')
    for (var i=0; i<response.length; i++) {
      console.log(response[i])
    }
    console.log('=========')
    console.log(`Total ${response.length} following`)
  })
}

async function fetchManager(username, logInfo, callback) {
  console.log(`Fetching userID of "${username}"...`)
  const user = await Instagram.getUser(username)
  if (user) {
    if (!user.is_private) {
      const userID = user.id
      if (userID) {
        console.log(`Fetching ${logInfo}...`)
        return await callback(userID)
      } else {
        console.log(`\n\n  REPLACING${Credentials.cookie} \n\n   `)
        await dbController.cookieSetToInvaid(Credentials)
        await dbController.replaceInvalidCookie()
        return fetchManager(username, logInfo, callback)
      }

    } else {
      console.log("account private")
      return []
    }
  }else{
    return []
  }
}

async function downloadImages(arrayOfStories) {
  for (var i=0; i<arrayOfStories.length; i++) {
    const url = arrayOfStories[i].href
    arrayOfStories[i].streamData = await Instagram.fetchMedia(url)
  }
  return arrayOfStories
}

function getFileName(url) {
  return url.match(/[a-zA-Z0-9\_]+\.(jpg|mp4)/)[0]
}

function resolvePath(path) {
  if (path[0] === '~') {
    return Path.join(process.env.HOME, path.slice(1))
  }
  if (!Path.isAbsolute(path)) {
    return Path.resolve(path)
  }
  return path
}

module.exports.posts = downloadPosts
module.exports.stories = downloadStories
module.exports.highlightedStories = downloadHighlightedStories
module.exports.taggedPhotos = downloadTaggedPhotos
module.exports.followers = downloadFollowers
module.exports.following = downloadFollowing
