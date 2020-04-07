const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks.fixtures')

describe.only('Bookmarks Endpoints', function() {
    //creating knex instance to connect to test db
    //& clearing any data so we know we have clean tables 
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        //app is express instance we create in src/app.js
        //express instance expects req.app.get('db) to return the knex instance
        //this allows .get('db') to work 
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks').truncate())

    //beforeEach is inserting same bookmark w. diff. uqiue id value => causing failed test
    //afterEach() => removes any table data so next test has clean start 
    afterEach('cleanup', () => db('bookmarks').truncate()) 

    describe(`GET /bookmarks`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, [])
            })
        })

        //context that describes app in a state where the db has bookmarks
        //beforeEach() => in context to insert some testBookmarks 
        context('Given there are bookmarks in the databse', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            /** now we can make tests inside the context  **/ 

            //& know that the db has the 3 bookmarks described
            //GET /bookmarks => should respond w. all the bookmarks in the db
            it('GET /bookmarks responds with 200 and all of the bookmarks', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`) //gets rid of 401 Unauthorized test fail
                    //2nd arg of expect => response body that we expect
                    .expect(200, testBookmarks) 
            })
        })
    })

    describe(`GET /bookmarks/:bookmark_id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
                const bookmarkId = 123456
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Bookmark Not Found `}
                    })
            })
        })

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            //GET /bookmarks/:bookmark_id
            //request containing ID of one of our test bookmarks 
            //asserted that response contains full bookmarks & 200 status
            it(' GET /bookmarks/:bookmark_id responds with 200 and the specified bookmark', () => {
                const bookmarkId = 2
                const expectedBookmark = testBookmarks[bookmarkId - 1]
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedBookmark)
            })
        })
    })
    
})