import fs from 'fs';
import { genImages } from './sketch'

const startIndex = parseInt(process.argv[2]);
const endIndex = parseInt(process.argv[3]);

const imagesSaveDir = './dist';

if (!fs.existsSync(imagesSaveDir)){
  fs.mkdirSync(imagesSaveDir);
}

genImages(startIndex, endIndex, imagesSaveDir);
