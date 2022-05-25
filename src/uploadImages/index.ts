import { upload } from './upload';

const startIndex = parseInt(process.argv[2]);
const endIndex = parseInt(process.argv[3]);

if (isNaN(startIndex) || isNaN(endIndex)) {
  throw 'You must specify two args as type of number.';
}

const imagesSaveDir = './dist';

upload(startIndex, endIndex, imagesSaveDir);
