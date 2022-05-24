import fs from 'fs';
import { genImage } from './sketch'

const imagesSaveDir = './dist';
if (!fs.existsSync(imagesSaveDir)){
  fs.mkdirSync(imagesSaveDir);
}

const startIndex = parseInt(process.argv[2]);
const endIndex = parseInt(process.argv[3]);

for (let i=startIndex; i<endIndex; i++) {
  genImage(i, imagesSaveDir);
}
