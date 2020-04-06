const { v4: uuidv4 } = require('uuid');

const bookmarks = [
    {
        id: uuidv4(), 
        title: 'Google',
        url: 'https://www.google.com',
        description: 'best search engine on the planet',
        rating: 5
    },
    {
        id: uuidv4(), 
        title: 'Leetcode',
        url: 'https://www.leetcode.com',
        description: 'learn all the algos',
        rating: 4
    }
]

module.exports = { bookmarks }