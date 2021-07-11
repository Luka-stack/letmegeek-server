import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { allWallArticleStatusesModes } from '../../walls/entities/wall-article-status';

export function IsWallArticleStatus(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    const wallStatuses = allWallArticleStatusesModes().join(', ');
    const message = `Provided wrong status. Possible Statuses are: ${wallStatuses}`;

    const validate = function (value: any, _args: ValidationArguments) {
      if (typeof value !== 'string') {
        return false;
      }

      if (!wallStatuses.includes(value.toUpperCase())) {
        return false;
      }

      return true;
    };

    const defaultMessage = () => {
      return message;
    };

    registerDecorator({
      name: 'isWallArticleStatus',
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
