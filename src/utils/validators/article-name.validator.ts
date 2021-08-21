import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsArticleName(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    const articleNames = ['books', 'games', 'mangas', 'comics', 'all'];
    const message = `Provided wrong article name. Possible articles are ${articleNames.join(
      ', ',
    )}`;

    const validate = function (value: any, _args: ValidationArguments) {
      if (typeof value !== 'string' || !articleNames.includes(value)) {
        return false;
      }

      return true;
    };

    const defaultMessage = () => {
      return message;
    };

    registerDecorator({
      name: 'isArticleName',
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
