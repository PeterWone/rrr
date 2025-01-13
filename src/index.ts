import axios from 'axios';
import { JSDOM } from 'jsdom';
import extractMetadata from './extract-story-metadata';
import extractChapterText from './extract-chapter-text';
import fs from 'fs';
import path from 'path';
import { log } from 'console';

const storyId = process.argv[2];
const outputFolder = process.argv[3] || process.cwd();
const barLength = 50;

if (!storyId) {
  console.error('Please provide a storyId as an argument');
  process.exit(1);
}

const safeName = (text: string): string => {
  return text.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/-+$/, '');
};


const fetchStory = async (storyId: string) => {
  try {
    const storyUrl = `https://www.royalroad.com/fiction/${storyId}`;
    const response = await axios.get(storyUrl);
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    const metadata = await extractMetadata(document);
    const coverArtDataUrl = metadata.coverArt; // Assuming metadata.coverArt contains the data URL
    const tocStyle =
`<style>
    body {
    font-family: Georgia, serif;
    background-image: url('${coverArtDataUrl}');
    background-size: cover;
    background-repeat: no-repeat;
    background-attachment: fixed;
    background-color: rgba(255, 255, 255, 0.8); /* Fallback color */
    background-blend-mode: lighten; /* Blend the background image with a light color */
  }
  table {
    background-color: #004b7a;
    color: silver;
    font-family: sans-serif;
    margin: auto;
    padding: 0.5em;
  }
  blockquote {
    font-style: italic;
    margin: 1em 0;
  }
</style>`;

    const chapterStyle =
`<style>
    body {
    font-family: Georgia, serif;
    background-color: rgba(255, 255, 255, 0.8); /* Fallback color */
  }
  table {
    background-color: #004b7a;
    color: silver;
    font-family: sans-serif;
    margin: auto;
    padding: 0.5em;
  }
  blockquote {
    font-style: italic;
    margin: 1em 0;
  }
</style>`;

    const storyFolderName = path.join(outputFolder, safeName(metadata.title));
    fs.mkdirSync(storyFolderName, { recursive: true });
    log(`Output folder: ${storyFolderName}`);

    const extractionDate = new Date().toISOString().split('T')[0];
    const tocFileName = path.join(storyFolderName, `${safeName(metadata.title)}-as-at-${extractionDate}-toc.html`);
    const tocStream = fs.createWriteStream(tocFileName);

    tocStream.write(`<html><head><title>${metadata.title} - TOC</title>${tocStyle}</head><body>`);
    tocStream.write(`<h1>${metadata.title}</h1><h2>by ${metadata.author}</h2>`);
    tocStream.write(`<p>${metadata.description}</p>`);
    tocStream.write(`<h1>Table of Contents</h1><ul>`);
    log(`Fetching story: ${metadata.canonicalUrl}`);

    const totalChapters = metadata.chapters.length;
    const startTime = Date.now();
    for (let i = 0; i < totalChapters; i++) {
      const chapterMeta = metadata.chapters[i];
      const chapterTitle = chapterMeta.title;
      const chapterDate = new Date(chapterMeta.datePublished).toISOString().split('T')[0];
      const chapterFileName = `${chapterDate}-${safeName(chapterTitle)}.html`;
      const chapterFilePath = path.join(storyFolderName, chapterFileName);

      // Check if chapter file already exists
      if (fs.existsSync(chapterFilePath)) {
        const chapterContent = fs.readFileSync(chapterFilePath, 'utf-8');
        const wordCount = chapterContent.split(/\s+/).length;
        tocStream.write(`<li><a href="./${chapterFileName}">${chapterTitle}</a> - ${wordCount} words (already exists)</li>`);
        continue;
      }

      const chapterUrl = `https://www.royalroad.com${chapterMeta.url}`;
      const chapterResponse = await axios.get(chapterUrl);
      const chapterDom = new JSDOM(chapterResponse.data);
      const chapterDocument = chapterDom.window.document;
      const chapterText = extractChapterText(chapterDocument);

      const wordCount = chapterText.split(/\s+/).length;

      const chapterStream = fs.createWriteStream(chapterFilePath);
      chapterStream.write(`<html><head><title>${chapterTitle}</title>${chapterStyle}</head><body>`);
      chapterStream.write(`<h2>${chapterTitle}</h2>`);
      chapterStream.write(`<p>Word count: ${wordCount}</p>`);

      // Add navigation links at the start
      chapterStream.write('<p>');
      if (i > 0) {
        const prevChapterMeta = metadata.chapters[i - 1];
        const prevChapterDate = new Date(prevChapterMeta.datePublished).toISOString().split('T')[0];
        const prevChapterFileName = `${prevChapterDate}-${safeName(prevChapterMeta.title)}.html`;
        chapterStream.write(`<a href="./${prevChapterFileName}">Back (${prevChapterMeta.title})</a> | `);
      }
      chapterStream.write(`<a href="./${path.basename(tocFileName)}">Contents</a>`);
      if (i < totalChapters - 1) {
        const nextChapterMeta = metadata.chapters[i + 1];
        const nextChapterDate = new Date(nextChapterMeta.datePublished).toISOString().split('T')[0];
        const nextChapterFileName = `${nextChapterDate}-${safeName(nextChapterMeta.title)}.html`;
        chapterStream.write(` | <a href="./${nextChapterFileName}">Next (${nextChapterMeta.title})</a>`);
      }
      chapterStream.write('</p>');

      chapterStream.write(chapterText);

      // Add navigation links at the end
      chapterStream.write('<p>');
      if (i > 0) {
        const prevChapterMeta = metadata.chapters[i - 1];
        const prevChapterDate = new Date(prevChapterMeta.datePublished).toISOString().split('T')[0];
        const prevChapterFileName = `${prevChapterDate}-${safeName(prevChapterMeta.title)}.html`;
        chapterStream.write(`<a href="./${prevChapterFileName}">Back (${prevChapterMeta.title})</a> | `);
      }
      chapterStream.write(`<a href="./${path.basename(tocFileName)}">Contents</a>`);
      if (i < totalChapters - 1) {
        const nextChapterMeta = metadata.chapters[i + 1];
        const nextChapterDate = new Date(nextChapterMeta.datePublished).toISOString().split('T')[0];
        const nextChapterFileName = `${nextChapterDate}-${safeName(nextChapterMeta.title)}.html`;
        chapterStream.write(` | <a href="./${nextChapterFileName}">Next (${nextChapterMeta.title})</a>`);
      }
      chapterStream.write('</p>');

      chapterStream.write(`</body></html>`);
      chapterStream.end();

      tocStream.write(`<li><a href="./${chapterFileName}">${chapterTitle}</a> - ${wordCount} words</li>`);

      const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
      const estimatedTotalTime = (elapsedTime / (i + 1)) * totalChapters;
      const remainingTime = Math.round(estimatedTotalTime - elapsedTime);

      const done = Math.floor((i + 1) / totalChapters * barLength);
      const remaining = barLength - done;
      const percentage = Math.round((i + 1) / totalChapters * 100);
      const bar = `[${'='.repeat(done)}${' '.repeat(remaining)}]`;
      const barWithPercentage = bar.substring(0, Math.floor(barLength / 2) - 3) + ` ${percentage}% ` + bar.substring(Math.floor(barLength / 2) + 4);
      process.stdout.write(`\rProgress: ${barWithPercentage} | Remaining time: ${remainingTime}s   `);
    }

    tocStream.write(`</ul></body></html>`);
    tocStream.end();

  } catch (error) {
    console.error('Error fetching story metadata:', error);
  }
};

fetchStory(storyId);
