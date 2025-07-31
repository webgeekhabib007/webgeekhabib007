const fs = require('fs');
const path = require('path');
const https = require('https');

const README_PATH = path.join(__dirname, '../../README.md');
const START_TAG = '<!-- MEME-START -->';
const END_TAG = '<!-- MEME-END -->';

function fetchMeme(callback) {
  https.get('https://meme-api.com/gimme', (res) => {
    let data = '';

    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        const meme = {
          title: json.title,
          url: json.url
        };
        callback(null, meme);
      } catch (err) {
        callback(err);
      }
    });
  }).on('error', (err) => callback(err));
}

function updateReadme({ title, url }) {
  const readme = fs.readFileSync(README_PATH, 'utf-8');

  const memeMarkdown = `${START_TAG}
**${title}**  
<img src="${url}" alt="Random Meme" width="500"/>
${END_TAG}`;

  const updated = readme.replace(
    new RegExp(`${START_TAG}[\\s\\S]*?${END_TAG}`, 'g'),
    memeMarkdown
  );

  fs.writeFileSync(README_PATH, updated, 'utf-8');
}

fetchMeme((err, meme) => {
  if (err) {
    console.error('Failed to fetch meme:', err);
    process.exit(1);
  }
  updateReadme(meme);
});
