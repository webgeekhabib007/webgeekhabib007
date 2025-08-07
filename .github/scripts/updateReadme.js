const fs = require('fs');
const path = require('path');
const https = require('https');
const role = "general"

const README_PATH = path.join(__dirname, '../../README.md');
const START_TAG = '<!-- MEME-START -->';
const END_TAG = '<!-- MEME-END -->';
const MAX_RETRIES = 5;

function fetchMeme(retries = 0, callback) {
  https.get('https://meme-api.com/gimme', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);

        // ✅ Skip if NSFW or missing image
        if (json.nsfw || !json.preview || json.preview.length === 0) {
          if (retries < MAX_RETRIES) {
            console.log(`⚠️ NSFW or invalid meme found. Retrying (${retries + 1})...`);
            fetchMeme(retries + 1, callback);
          } else {
            callback(new Error("Reached max retries without safe meme."));
          }
          return;
        }

        const meme = {
          title: json.title,
          imageUrl: json.preview[json.preview.length - 1], // use high-res preview
        };

        callback(null, meme);
      } catch (err) {
        callback(err);
      }
    });
  }).on('error', (err) => callback(err));
}

function updateReadme({ title, imageUrl }) {
  const readme = fs.readFileSync(README_PATH, 'utf-8');

  const newBlock = `${START_TAG}
**${title}**  
<img src="${imageUrl}" alt="Random Meme" width="500"/>
${END_TAG}`;

  const updated = readme.replace(
    new RegExp(`${START_TAG}[\\s\\S]*?${END_TAG}`, 'g'),
    newBlock
  );

  fs.writeFileSync(README_PATH, updated, 'utf-8');
  console.log("✅ README updated with safe meme:", title);
}

fetchMeme(0, (err, meme) => {
  if (err) {
    console.error('❌ Failed to fetch safe meme:', err);
    process.exit(1);
  }
  updateReadme(meme);
});
