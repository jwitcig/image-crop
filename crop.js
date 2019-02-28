const PNG = require('png-js');
const Jimp = require('jimp');
const fs = require('fs');

const inputPath = process.argv[2];
const outputPath = process.argv[3];

const isEmpty = pixel => pixel.a === 0;

const writeImage = ({ filename, pixels, firstPixel, imageSize }) => {
  const { top, bottom, left, right } = firstPixel;

  const index = (x, y) => y * (right - left) + x;

  const image = new Jimp(right - left, bottom - top);

  for (let y=top; y<=bottom; y++) {
    for (let x=left; x<=right; x++) {
      const oldIndex = y * imageSize.width + x;
      const i = index(x - left, y - top);
  
      image.bitmap.data[i * 4   ] = pixels[oldIndex * 4     ];
      image.bitmap.data[i * 4 + 1] = pixels[oldIndex * 4 + 1];
      image.bitmap.data[i * 4 + 2] = pixels[oldIndex * 4 + 2];
      image.bitmap.data[i * 4 + 3] = pixels[oldIndex * 4 + 3];
    }
  }
  image.write(filename);
};

const cropImage = (inputFilename, outputFilename, shouldLog) => {
  const { width, height } = PNG.load(inputFilename);

  let firstPixel = {};

  PNG.decode(inputFilename, pixels => {
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
      filename: outputFilename,
      pixels,
      firstPixel,
      imageSize: { width, height },
    });

    if (shouldLog) {
      const components = outputFilename.split('.');
      components.pop();
      const logFilename = components.join('.');

      const logData = `left:${firstPixel.left}\n` +
                       `right:${firstPixel.right}\n` +
                       `top:${firstPixel.top}\n` +
                       `bottom:${firstPixel.bottom}\n`;
      fs.writeFile(`${logFilename}.txt`, logData, err => {
        if (err) console.log(err);
      });
    }
  });
};

const stats = fs.statSync(inputPath);
const shouldLog = process.argv.includes('--log');

if (stats.isDirectory()) {
  fs.readdir(inputPath, (err, files) => {
    files.forEach(filename => {
      if (filename.includes('.png')) {
        cropImage(`${inputPath}/${filename}`, `${outputPath}/${filename}`, shouldLog);
      }
    });
  });
} else if (stats.isFile()) {
  if (outputPath.includes('.png')) {
    cropImage(inputPath, outputPath);
  } else {
    const components = inputPath.split('/');
    const filename = components[components.length - 1];
    cropImage(inputPath, `${outputPath}/${filename}`, shouldLog);
  }
}