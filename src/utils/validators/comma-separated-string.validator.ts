import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsCommaSeparatedString(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    const message = `${propertyName.replace(/^\w/, (c) =>
      c.toUpperCase(),
    )} can contain only letters and numbers. Multiple values have to be separate with a comma`;

    const validate = function (value: any, _args: ValidationArguments) {
      let result = true;
      const regex = /^[a-zA-Z0-9\s.()-]+$/;
      const genres = value.split(',').map((v: string) => v.trim());
      genres.forEach((genre: string) => {
        if (!regex.test(genre)) {
          result = false;
          return;
        }
      });

      return result;
    };

    const defaultMessage = function () {
      return message;
    };

    registerDecorator({
      name: 'isCommaSeparatedString',
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
