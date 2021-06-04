import {File} from 'nodejs-shared';

/**
 * Convert image to data URL.
 */
export function convertImageToDataURL(img) {
  if (typeof img === 'string' && /^data:image\//.test(img))
    return img.split(',')[1];
  else if (File.isFile(img))
    return File.readAsBase64(img).split(',')[1];
  else
    throw new Error('The parameter image is invalid');
}

/**
 * Returns the file extension.
 */
export function getExtension(img) {
  if (typeof img === 'string' && /^data:image\//.test(img))
    return img.toString().slice(img.indexOf('/') + 1, img.indexOf(';'));
  else if (File.isFile(img)) {
    const i = img.lastIndexOf('.');
    return (i < 0) ? '' : img.substr(i);
  } else
    throw new Error('The parameter image is invalid');
}