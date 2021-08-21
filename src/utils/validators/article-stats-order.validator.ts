import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsArticlesStatProperty(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    const properties = ['avgScore', 'members', 'scoreCount'];
    const message = `Provided wrong stats property. Possible properties are ${properties.join(
      ', ',
    )}`;

    const validate = function (value: any, _args: ValidationArguments) {
      if (typeof value !== 'string' || !properties.includes(value)) {
        return false;
      }

      return true;
    };

    const defaultMessage = () => {
      return message;
    };

    registerDecorator({
      name: 'isArticlesStatProperty',
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
