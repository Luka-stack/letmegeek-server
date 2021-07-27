export enum UserRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  USER = 'USER',
}

export function allUserRoles(): Array<string> {
  return [UserRole.ADMIN, UserRole.MODERATOR, UserRole.USER];
}
