import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsCommaSeparatedString(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    const message =
      'Value can contain only letters and numbers. Multiple values have to be separate with a space';

    const validate = function (value: any, _args: ValidationArguments) {
      const regex = /^[a-zA-Z0-9]+$/;
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
