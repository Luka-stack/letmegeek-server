import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsGenreString(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    const message =
      'Genres can contain only letters. Multiple genres have to be separate with a space';

    const validate = function (value: any, _args: ValidationArguments) {
      const regex = /^[a-zA-Z]+$/;
      const genres = value.split(' ');
      genres.forEach((genre) => {
        if (!regex.test(genre)) {
          return false;
        }
      });

      return true;
    };

    const defaultMessage = function () {
      return message;
    };

    registerDecorator({
      name: 'isGenreString',
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
