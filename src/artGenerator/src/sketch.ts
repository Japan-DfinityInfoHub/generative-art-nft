import p5 from 'node-p5';
import md5 from 'md5';

// Generate and Save the generative art as a png image
const sketch = (startIndex: number, endIndex: number, imagesSaveDir: string) => {

  // @ts-expect-error: Because node-p5 doesn't support typescript
  return (p) => {
    let index = startIndex;

    p.draw = () => {
      p.clear();

      const tokenIndexStr = String(index)

      const hashedNftSeed = md5(tokenIndexStr)
      const getSlicedNum = (x: number, y: number) : number => {
        return parseInt(hashedNftSeed.slice(x, y), 16)
      }
  
      const lineLengthSeed = getSlicedNum(0, 2) + 1; // 1~257
  
      const strokeColorV1 = getSlicedNum(2, 4); // 0~255
      const strokeColorV2 = getSlicedNum(4, 6); // 0~255
      const strokeColorV3 = getSlicedNum(6, 8); // 0~255
  
      const noiseScale = (getSlicedNum(8, 11) % 1000) / 10000; //0.0001~0.1000
  
      const rotateSeed = getSlicedNum(11, 13); // 0~255
  
      const backgroundColorV1 = getSlicedNum(15, 17); // 0~255
      const backgroundColorV2 = getSlicedNum(17, 19); // 0~255
      const backgroundColorV3 = getSlicedNum(19, 21); // 0~255
  
      const drawIterateVal = getSlicedNum(21, 25) + 100000; // 100000~165536
  
      const randomSeedVal = getSlicedNum(26, 29); // 0~4096
      const noiseSeedVal = getSlicedNum(29, 32); // 0~4096

      const canvas = p.createCanvas(500, 500);
      p.background(backgroundColorV1, backgroundColorV2, backgroundColorV3, 255);
    
      p.randomSeed(randomSeedVal);
      p.noiseSeed(noiseSeedVal);
    
      for (let i = 0; i < drawIterateVal; i++){
        const x = p.random(p.width);
        const y = p.random(p.height);
        const noiseFactor = p.noise(x*noiseScale, y*noiseScale);
        const lineLength = noiseFactor * lineLengthSeed;
        
        p.push();
        p.translate(x, y);
        p.rotate(noiseFactor * p.radians(rotateSeed));
        p.stroke(strokeColorV1, strokeColorV2, strokeColorV3, 6);
        p.strokeWeight(1);
        p.line(0, 0, lineLength, lineLength);
        p.pop();
      }

      p.saveCanvas(canvas, `${imagesSaveDir}/${tokenIndexStr}`, 'png').then(() => {
        console.log(`saved canvas as ${imagesSaveDir}/${tokenIndexStr}.png`);
      }).catch(console.error)

      index++;
      if (index > endIndex) {
        p.noLoop();
      }
    }
  }
}

export const genImages = (startIndex: number, endIndex: number, imagesSaveDir: string) => {
  p5.createSketch(sketch(startIndex, endIndex, imagesSaveDir));
}
