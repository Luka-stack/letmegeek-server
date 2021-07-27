import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { allUserRoles } from '../../auth/entities/user-role';

export function IsUserRole(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    const userRoles = allUserRoles().join(', ');
    const message = `Provided wrong user role. Possible user roles are: ${userRoles}`;

    const validate = function (value: any, _args: ValidationArguments) {
      if (typeof value !== 'string') {
        return false;
      }

      if (!userRoles.includes(value.toUpperCase())) {
        return false;
      }

      return true;
    };

    const defaultMessage = () => {
      return message;
    };

    registerDecorator({
      name: 'isUserRole',
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
