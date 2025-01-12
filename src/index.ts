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
    
    const storyFolderName = path.join(outputFolder, safeName(metadata.title));
    fs.mkdirSync(storyFolderName, { recursive: true });
    log(`Output folder: ${storyFolderName}`);
    
    const extractionDate = new Date().toISOString().split('T')[0];
    const storyFileName = path.join(storyFolderName, `${safeName(metadata.title)}-as-at-${extractionDate}.html`);
    const tocFileName = path.join(storyFolderName, `${safeName(metadata.title)}-as-at-${extractionDate}-toc.html`);
    const storyStream = fs.createWriteStream(storyFileName);
    const tocStream = fs.createWriteStream(tocFileName);
    
    storyStream.write(`<html><head><title>${metadata.title}</title></head><body>`);
    storyStream.write(`<h1>${metadata.title}</h1><h2>by ${metadata.author}</h2>`);
    tocStream.write(`<html><head><title>${metadata.title} - TOC</title></head><body>`);
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
      storyStream.write(`<h2>${chapterTitle}</h2>${chapterText}`);
      const chapterFileName = `${chapterDate}-${safeName(chapterTitle)}.html`;
      const chapterFilePath = path.join(storyFolderName, chapterFileName);
      const chapterStream = fs.createWriteStream(chapterFilePath);
      chapterStream.write(`<html><head><title>${chapterTitle}</title></head><body>`);
      chapterStream.write(`<h2>${chapterTitle}</h2>${chapterText}`);
      chapterStream.write(`</body></html>`);
      chapterStream.end();
      
      tocStream.write(`<li><a href="./${chapterFileName}">${chapterTitle}</a></li>`);
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
