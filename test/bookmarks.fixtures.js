
function makeBookmarksArray() {
    return [
        {
            id: 1, 
            title: 'Apple',
            url: 'https://www.apple.com',
            description: 'buy an iPhone here',
            rating: 4
        },
        {
            id: 2, 
            title: 'Guitar Center',
            url: 'https://www.guitarcenter.com',
            description: 'buy some instruments',
            rating: 3
        },
        {
            id: 3, 
            title: 'eBay',
            url: 'https://www.ebay.com',
            description: 'buy used items',
            rating: 2
        }
    ]
}

module.exports = {
    makeBookmarksArray,
}