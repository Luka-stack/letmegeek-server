import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SignupDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString() // for now
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
