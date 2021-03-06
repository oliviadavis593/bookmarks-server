const express = require('express')
const { v4: uuidv4 } = require('uuid')
const { isWebUri } = require('valid-url')
const logger = require('../logger')
const store = require('../store')

const bookmarksRouter = express.Router()
const bodyParser = express.json() //e.j() must be applied to parse JSON data in body of request

bookmarksRouter
    .route('/bookmarks')
    //returns array of bookmarks 
    .get((req, res) => {
        res.json(store.bookmarks)
    })
    .post(bodyParser, (req, res) => {
        for (const field of ['title', 'url', 'rating']) {
            if (!req.body[field]) {
                logger.error(`${field} is required`)
                return res.status(400).send(`'${field}' is required`)
            }
        }
        const { title, url, description, rating } = req.body //get data from the body 

        /*once you get data from body => validate that these exist */
        if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
            logger.error(`Invalid rating '${rating}' supplied`)
            return res.status(400).send(`'rating' must be a number between 0 and 5`)
        }

        if (!isWebUri(url)) {
            logger.error(`Invalid url '${url}' supplied`)
            return res.status(400).send(`'url' must be a valid URL`)
        }

        //if they do exist => generate an ID & push bookmark card object into array
        const bookmark = { id: uuidv4(), title, url, description, rating}

        store.bookmarks.push(bookmark)

        //log bookmark creation & send response including location header 
        logger.info(`Bookmark with id ${bookmark.id} created`)
        res
            .status(201)
            .location(`http://localhost:8000/bookmarks/${bookmark.id}`)
            .json(bookmark)
    })

bookmarksRouter
    .route('/bookmarks/:bookmark_id')
    //handler that returns a single bookmark w. given ID
    //return 404 Not Found if ID isn't valid 
    .get((req, res) => {
        const { bookmark_id } = req.params

        const bookmark = store.bookmarks.find(c => c.id == bookmark_id)

        //make sure we found a bookmark 
        if (!bookmark) {
            logger.error(`Bookmark with id ${bookmark_id} not found.`)
            return res
                .status(404)
                .send('Bookmark Not Found')
        }

        res.json(bookmark)
    })
    //delete a bookmark given it's id
    .delete((req, res) => {
        const { bookmark_id } = req.params //peels param out of the request 

        const bookmarkIndex = store.bookmarks.findIndex(b => b.id === bookmark_id)

        if (bookmarkIndex === -1) {
            logger.error(`Bookmarks with id ${bookmark_id} not found`)
            return res
                .status(404)
                .send('Bookmark Not Found')
        }

        store.bookmarks.splice(bookmarkIndex, 1)

        logger.info(`Bookmark with id ${bookmark_id} deleted`)
        res
            .status(204)
            .end()
    })

module.exports = bookmarksRouter