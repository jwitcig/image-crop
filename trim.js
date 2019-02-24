const PNG = require('png-js');
const Jimp = require('jimp');

const imagePath = process.argv[2];
console.log('Image Path:', imagePath);

const { width, height } = PNG.load(imagePath);

const isEmpty = pixel => pixel.a === 0;

const writeImage = ({ filename, pixels, firstPixel }) => {
  const { top, bottom, left, right } = firstPixel;

  const index = (x, y) => y * (right - left) + x;

  const image = new Jimp(right - left, bottom - top);

  for (let y=top; y<=bottom; y++) {
    for (let x=left; x<=right; x++) {
      const oldIndex = y * width + x;
      const i = index(x - left, y - top);
  
      image.bitmap.data[i * 4   ] = pixels[oldIndex * 4     ];
      image.bitmap.data[i * 4 + 1] = pixels[oldIndex * 4 + 1];
      image.bitmap.data[i * 4 + 2] = pixels[oldIndex * 4 + 2];
      image.bitmap.data[i * 4 + 3] = pixels[oldIndex * 4 + 3];
    }
  }
  image.write(filename);
};

let firstPixel = {};

PNG.decode(imagePath, pixels => {
  const pixel = (x, y) => ({
    r: pixels[(y * width + x) * 4    ],
    g: pixels[(y * width + x) * 4 + 1],
    b: pixels[(y * width + x) * 4 + 2],
    a: pixels[(y * width + x) * 4 + 3],
  });

  (() => {
    for (let y=0; y<height; y++) {
      for (let x=0; x<width; x++) {
        if (!isEmpty(pixel(x, y))) {
          firstPixel.top = y;
          return;
        }
      }
    }
  })();

  (() => {
    for (let y=height-1; y>=0; y--) {
      for (let x=0; x<width; x++) {  
        if (!isEmpty(pixel(x, y))) {
          firstPixel.bottom = y;
          return;
        }
      }
    }
  })();

  (() => {
    for (let x=0; x<width; x++) {
      for (let y=0; y<height; y++) {
        if (!isEmpty(pixel(x, y))) {
          firstPixel.left = x;
          return;
        }
      }
    }
  })();

  (() => {
    for (let x=width-1; x>=0; x--) {
      for (let y=0; y<height; y++) {
        if (!isEmpty(pixel(x, y))) {
          firstPixel.right = x;
          return;
        }
      }
    }
  })();

  writeImage({
    filename: 'result.png',
    pixels,
    firstPixel,
  });
});