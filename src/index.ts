import axios from 'axios';
import { JSDOM } from 'jsdom';
import extractMetadata from './extract-story-metadata';

const storyId = process.argv[2];

if (!storyId) {
  console.error('Please provide a storyId as an argument');
  process.exit(1);
}

const fetchStoryMetadata = async (storyId: string) => {
  try {
    const response = await axios.get(`https://www.royalroad.com/fiction/${storyId}`);
    const dom = new JSDOM(response.data);
    const metadata = extractMetadata(dom.window.document);
    console.log('Story Metadata:', JSON.stringify(metadata, null, 2));
    
  } catch (error) {
    console.error('Error fetching story metadata:', error);
  }
};

fetchStoryMetadata(storyId);
