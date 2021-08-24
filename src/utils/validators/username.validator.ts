import {
  ValidationOptions,
  ValidationArguments,
  registerDecorator,
} from 'class-validator';

export function IsUsername(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    const message =
      'Username must contain only letters, digits, "-", "_", "." and must be at least 2 characters long';

    const validate = function (value: any, _args: ValidationArguments) {
      const regex = /^[A-Za-z][A-Za-z0-9_\.\-\_]+$/;

      if (typeof value !== 'string') {
        return false;
      }

      if (!regex.test(value)) {
        return false;
      }

      return true;
    };

    const defaultMessage = function () {
      return message;
    };

    registerDecorator({
      name: 'isUsername',
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
