import { IsBoolean, IsNotEmpty } from 'class-validator';

import { UserRole } from '../../auth/entities/user-role';
import { IsUserRole } from '../../utils/validators/user-role.validator';

export class UserUpdateStatusDto {
  @IsNotEmpty()
  @IsBoolean()
  status: boolean;
}

export class UserUpdateRoleDto {
  @IsNotEmpty()
  @IsUserRole()
  role: UserRole;
}
