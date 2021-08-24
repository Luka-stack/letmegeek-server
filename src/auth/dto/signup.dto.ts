import { IsEmail, IsNotEmpty } from 'class-validator';

import { IsPassword } from '../../utils/validators/password.validator';
import { IsUsername } from '../../utils/validators/username.validator';

export class SignupDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsUsername()
  username: string;

  @IsNotEmpty()
  @IsPassword()
  password: string;
}
