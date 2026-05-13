import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Mark a controller method as not requiring authentication.
// Used by SessionAuthGuard to short-circuit the cookie/session check.
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
