import { IsBoolean } from 'class-validator';

import { UserRole } from '../../auth/entities/user-role';
import { IsUserRole } from '../../utils/validators/user-role.validator';

export class UserUpdateStatusDto {
  @IsBoolean()
  status: boolean;
}

export class UserUpdateRoleDto {
  @IsUserRole()
  role: UserRole;
}
