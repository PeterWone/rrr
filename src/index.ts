import axios from 'axios';
import { JSDOM } from 'jsdom';
import extractMetadata from './extract-story-metadata';
import extractChapterText from './extract-chapter-text';
import fs from 'fs';
import path from 'path';
import { log } from 'console';

const storyId = process.argv[2];
const outputFolder = process.argv[3] || process.cwd();

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
    const metadata = extractMetadata(document);
    const style =
`<style>
    body {
    font-family: Georgia, serif;
  }
  table {
    background-color: #004b7a;
    color: silver;
    font-family: sans-serif;
    margin: auto;
    padding: 0.5em;
  }
</style>`;

    const storyFolderName = path.join(outputFolder, safeName(metadata.title));
    fs.mkdirSync(storyFolderName, { recursive: true });
    log(`Output folder: ${storyFolderName}`);

    const extractionDate = new Date().toISOString().split('T')[0];
    const storyFileName = path.join(storyFolderName, `${safeName(metadata.title)}-as-at-${extractionDate}.html`);
    const tocFileName = path.join(storyFolderName, `${safeName(metadata.title)}-as-at-${extractionDate}-toc.html`);
    const storyStream = fs.createWriteStream(storyFileName);
    const tocStream = fs.createWriteStream(tocFileName);

    storyStream.write(`<html><head><title>${metadata.title}</title>${style}</head><body>`);
    storyStream.write(`<h1>${metadata.title}</h1><h2>by ${metadata.author}</h2>`);
    tocStream.write(`<html><head><title>${metadata.title} - TOC</title>${style}</head><body>`);
    tocStream.write(`<h1>${metadata.title}</h1><h2>by ${metadata.author}</h2>`);
    tocStream.write(`<p>${metadata.description}</p>`);
    tocStream.write(`<h1>Table of Contents</h1><ul>`);
    log(`Fetching story: ${metadata.canonicalUrl}`);

    const totalChapters = metadata.chapters.length;
    for (let i = 0; i < totalChapters; i++) {
      const chapterMeta = metadata.chapters[i];
      const chapterUrl = `https://www.royalroad.com${chapterMeta.url}`;
      const chapterResponse = await axios.get(chapterUrl);
      const chapterDom = new JSDOM(chapterResponse.data);
      const chapterDocument = chapterDom.window.document;
      const chapterText = extractChapterText(chapterDocument);
      const chapterTitle = chapterMeta.title;
      const chapterDate = new Date(chapterMeta.datePublished).toISOString().split('T')[0];

      const wordCount = chapterText.split(/\s+/).length;

      const chapterFileName = `${chapterDate}-${safeName(chapterTitle)}.html`;
      const chapterFilePath = path.join(storyFolderName, chapterFileName);
      const chapterStream = fs.createWriteStream(chapterFilePath);
      chapterStream.write(`<html><head><title>${chapterTitle}</title>${style}</head><body>`);
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
      chapterStream.write('<a href="./toc.html">Contents</a>');
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
      chapterStream.write('<a href="./toc.html">Contents</a>');
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
      process.stdout.write(`Progress: ${((i + 1) / totalChapters * 100).toFixed(2)}%\r`);
    }

    storyStream.write(`</body></html>`);
    storyStream.end();
    tocStream.write(`</ul></body></html>`);
    tocStream.end();
    console.log('\nStory, chapters, and TOC saved successfully.');

  } catch (error) {
    console.error('Error fetching story metadata:', error);
  }
};

fetchStory(storyId);
