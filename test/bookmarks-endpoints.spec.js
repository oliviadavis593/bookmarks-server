const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const fixtures = require('./bookmarks.fixtures')

describe('Bookmarks Endpoints', function() {
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
            const testBookmarks = fixtures.makeBookmarksArray()

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

        context(`Given an XSS attack bookmark`, () => {
            const { maliciousBookmark, expectedBookmark } = fixtures.makeMaliciousBookmark()

            beforeEach('insert malicious bookmark', () => {
                return db
                    .into('bookmarks')
                    .insert([maliciousBookmark])
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/bookmarks`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].title).to.eql(expectedBookmark.title)
                        expect(res.body[0].description).to.eql(expectedBookmark.description)
                    })
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
                        error: { message: `Bookmark Not Found`}
                    })
            })
        })

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = fixtures.makeBookmarksArray()

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

        //ensure XSS sanitization takes place on GET /bookmarks/:bookmarks_id
        context(`Given an XSS attack article`, () => {
            const { maliciousBookmark, expectedBookmark } = fixtures.makeMaliciousBookmark()

            beforeEach('insert malicious article', () => {
                return db
                    .into('bookmarks')
                    .insert([ maliciousBookmark ])
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/bookmarks/${maliciousBookmark.id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedBookmark.title)
                        expect(res.body.description).to.eql(expectedBookmark.description)
                    })
            })
        })

        context(`Given an XSS attack bookmark`, () => {
            const { maliciousBookmark, expectedBookmark } = fixtures.makeMaliciousBookmark()

            beforeEach('insert malicious bookmark', () => {
                return db
                    .into('bookmarks')
                    .insert([maliciousBookmark])
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/bookmarks/${maliciousBookmark.id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedBookmark.title)
                        expect(res.body.description).to.eql(expectedBookmark.description)
                    })
            })
        })
    })

    /*POST /bookmarks */ 

    //If post request has valid => bookmark should be inserted into db 
    //& response should have status 201 to indicate successful creation
    //should contain title, url, rating & description
    //id will be auto populate by server using column defaults 
    describe(`POST /bookmarks`, () => {
        it(`creates a bookmark, responding with 201 and the new bookmark`, function() {
            const newBookmark =  {
                title: 'Test new bookmark',
                url: 'https://testing.com',
                description: 'test description',
                rating: 3,
            }
            return supertest(app)
                .post(`/bookmarks`)
                .send(newBookmark)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body.rating).to.eql(newBookmark.rating)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
                })
                .then(res => 
                    supertest(app)
                        .get(`/bookmarks/${res.body.id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(res.body)    
                )
        })

        /* POST validation  */
        //testing when body of POST /bookmarks doesn't contain required info (title, url, rating)
        //when they're missing => response should be 400 status 
        //w. JSON body containing appropriate message 
        it(`responds with 400 and an error message when 'title' is missing`, () => {
            const bookmarkMissingTitle = {
                //title: 'test-title',
                url: 'https://testing.com',
                rating: 2
            }
            return supertest(app)
                .post(`/bookmarks`)
                .send(bookmarkMissingTitle)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(400, {
                    error: { message: `'title' is required`}
                })
        })

        it(`responds with 400 and an error when 'url' is missing`, () => {
            const bookmarkMissingUrl = {
                title: 'test-title',
                //url: 'https://testing.com,
                rating: 4,
            }
            return supertest(app)
                .post(`/bookmarks`)
                .send(bookmarkMissingUrl)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(400, {
                    error: { message: `'url' is required`}
                })
        })

        it(`responds with 400 and an error when 'rating' is missing`, () => {
            const bookmarkMissingRating = {
                title: 'test-title',
                url: 'https://testing.com',
                //rating: 5
            }
            return supertest(app)
                .post(`/bookmarks`)
                .send(bookmarkMissingRating)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(400, {
                    error: { message: `'rating' is required`}
                })
        })
    })

    it('removes XSS attack content from response', () => {
        const { maliciousBookmark, expectedBookmark } = fixtures.makeMaliciousBookmark()
        return supertest(app)
            .post(`/bookmarks`)
            .send(maliciousBookmark)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(201)
            .expect(res => {
                expect(res.body.title).to.eql(expectedBookmark.title)
                expect(res.body.description).to.eql(expectedBookmark.description)
            })

    })
    
})


