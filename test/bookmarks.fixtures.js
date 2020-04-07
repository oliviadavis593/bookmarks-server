
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

function makeMaliciousBookmark() {
    const maliciousBookmark = {
        id: 911,
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        url: 'https://www.hackers.com',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        rating: 1,
      }
      const expectedBookmark = {
        ...maliciousBookmark,
        title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
      }
      return {
        maliciousBookmark,
        expectedBookmark,
      }
}

module.exports = {
    makeBookmarksArray,
    makeMaliciousBookmark
}