import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { allGameModes } from 'src/games/entities/game-mode';

export function IsCommaSeparatedGameMode(
  validationOptions?: ValidationOptions,
) {
  return function (object: unknown, propertyName: string) {
    const gamesModes = allGameModes().join(', ');
    const message = `Value has to be a comma separated list of Game Modes. Possible Game Modes are: ${gamesModes}`;

    const validate = function (value: any, _args: ValidationArguments) {
      if (typeof value !== 'string') {
        return false;
      }

      let result = true;
      const modes = value.split(' ');
      modes.forEach((mode: string) => {
        if (!gamesModes.includes(mode)) {
          result = false;
          return;
        }
      });

      return result;
    };

    const defaultMessage = () => {
      return message;
    };

    registerDecorator({
      name: 'isCommaSeparatedGameMode',
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
