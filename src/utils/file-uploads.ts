import { FileFilterCallback } from 'multer';
import { extname } from 'path';
import { makeId } from './helpers';

export const imageFileFilter = (_, file: any, callback: FileFilterCallback) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    callback(null, true);
  } else {
    return callback(new Error('Only image files are allowed!'));
  }
};

export const editFilename = (_, file, callback) => {
  const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  const randomName = makeId(16);

  callback(null, `${name}-${randomName}${fileExtName}`);
};
