const express = require('express')
const { v4: uuidv4 } = require('uuid')
const { isWebUri } = require('valid-url')
const logger = require('../logger')
const store = require('../store')
const BookmarksService = require('./BookmarksService')

const bookmarksRouter = express.Router()
const bodyParser = express.json() //can read the body & send JSON response w. any numeric ID value

const serializeBookmark = bookmark => ({
    id: bookmark.id, 
    title: bookmark.title, 
    url: bookmark.url, 
    description: bookmark.description, 
    rating: Number(bookmark.rating),
})

bookmarksRouter
    .route('/bookmarks')
    //returns array of bookmarks 
    .get((req, res, next) => {
        //using BookmarksSerivce.getAllBookmarks to populate the response
        BookmarksService.getAllBookmarks(req.app.get('db'))
            .then(bookmarks => {
                res.json(bookmarks.map(serializeBookmark))
            })
            .catch(next) //passing next into .catch from promise chain so any errors get handled by error handler middleware
    })
    .post(bodyParser, (req, res, next) => {
        //refactored way to validate required information
        for (const field of ['title', 'url', 'rating']) {
            if (!req.body[field]) {
                logger.error(`${field} is required`)
                return res.status(400).send({
                    error: { message: `'${field}' is required`}
                })
            }
        }
        const { title, url, description, rating } = req.body //get data from the body 

        const ratingNum = Number(rating)

        /*once you get data from body => validate that these exist */
        if (!Number.isInteger(ratingNum) || ratingNum < 0 || ratingNum > 5) {
            logger.error(`Invalid rating '${rating}' supplied`)
            return res.status(400).send(`'rating' must be a number between 0 and 5`)
        }

        if (!isWebUri(url)) {
            logger.error(`Invalid url '${url}' supplied`)
            return res.status(400).send({
                error: { message: `'url' must be a valid URL`}
            })
        }

        const newBookmark = { title, url, rating, description }

        BookmarksService.insertBookmark(
            req.app.get('db'),
            newBookmark 
        )
            .then(bookmark => {
                //log bookmark creation & send response including location header 
                logger.info(`Bookmark with id ${bookmark.id} created`)
                res
                    .status(201)
                    .location(`/bookmarks/${bookmark.id}`) //location header for new article
                    .json(serializeBookmark(bookmark))
            })
            .catch(next)

    })

bookmarksRouter
    .route('/bookmarks/:bookmark_id')
    //handler that returns a single bookmark w. given ID
    //return 404 Not Found if ID isn't valid 
    .get((req, res, next) => {
        const { bookmark_id } = req.params

        BookmarksService.getById(req.app.get('db'), bookmark_id)
            .then(bookmark => {
                if (!bookmark) {
                    logger.error(`Bookmark with id ${bookmark_id} not found`)
                    return res.status(404).json({
                        error: { message: 'Bookmark Not Found'}
                    })
                }
                res.json(serializeBookmark(bookmark))
            })
            .catch(next)
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