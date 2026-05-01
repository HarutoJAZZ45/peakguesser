const still_missing = [
  { id: 'hotaka', wiki: '穂高岳' },
  { id: 'nasu', wiki: '茶臼岳_(栃木県)' },
  { id: 'ena', wiki: '恵那山' },
];

async function getImageUrl(wikiTitle) {
  // Try both image approaches
  const url1 = `https://ja.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=pageimages&piprop=original&format=json&origin=*`;
  const url2 = `https://ja.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=pageimages&piprop=thumbnail&pithumbsize=1280&format=json&origin=*`;
  
  for (const url of [url1, url2]) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      const pages = data.query.pages;
      const page = Object.values(pages)[0];
      if (page.original) return page.original.source;
      if (page.thumbnail) return page.thumbnail.source;
    } catch (e) {}
  }
  return null;
}

async function main() {
  for (const m of still_missing) {
    const url = await getImageUrl(m.wiki);
    console.log(`${m.id}: ${url || 'NOT_FOUND'}`);
  }
}

main();
