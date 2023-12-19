// 校验错误
export class ValidationError extends Error {}
// 资源失效错误
export class ExpiredError extends Error {}
// 找不到资源错误
export class NotFoundError extends Error {}
// 资源已存在错误
export class AlreadyExistError extends Error {}

export class UserEmailInvalidError extends ValidationError {}
export class UserEmailAlreadyExistError extends AlreadyExistError {}
export class UserNameInvalidError extends ValidationError {}
export class UserNameAlreadyExistError extends AlreadyExistError {}
export class UserPasswordNotSecureError extends ValidationError {}
export class UserNotExistError extends NotFoundError {}
export class InviteCodeAlreadyExistError extends AlreadyExistError {}
export class InviteCodeInvalidError extends ExpiredError {}
