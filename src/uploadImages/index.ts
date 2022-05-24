import { upload } from './upload';

const startIndex = parseInt(process.argv[2]);
const endIndex = parseInt(process.argv[3]);

const imagesSaveDir = './src/artGenerator/dist';

upload(startIndex, endIndex, imagesSaveDir);
