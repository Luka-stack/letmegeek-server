import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

import { allMangaTypes } from '../../articles/mangas/entities/manga-type';

export function IsMangaType(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    const gamesModes = allMangaTypes().join(', ');
    const message = `Provided wrong Manga Type. Possible types are: ${allMangaTypes}`;

    const validate = function (value: any, _args: ValidationArguments) {
      if (typeof value !== 'string') {
        return false;
      }

      return gamesModes.includes(value.toUpperCase()) ? true : false;
    };

    const defaultMessage = () => {
      return message;
    };

    registerDecorator({
      name: 'isMangaType',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate,
        defaultMessage,
      },
    });
  };
}
