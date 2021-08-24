import {
  ValidationOptions,
  ValidationArguments,
  registerDecorator,
} from 'class-validator';

export function IsPassword(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    const message =
      'Password must contain at least 1 number, 1 uppercase letter, 1 lowercase letter, 1 non-alpha numeric number and be at least 8 characters long';

    const validate = function (value: any, _args: ValidationArguments) {
      const regex =
        /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,}$/;

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
      name: 'isPassword',
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
