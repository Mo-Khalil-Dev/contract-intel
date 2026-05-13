import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetCurrentUserQuery, CurrentUserView } from './get-current-user.query';
import { USER_REPOSITORY, IUserRepository } from '../../domain/user.repository';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { NotFoundException } from '../../../../shared/exceptions/app-error';

@QueryHandler(GetCurrentUserQuery)
export class GetCurrentUserHandler implements IQueryHandler<GetCurrentUserQuery, CurrentUserView> {
  constructor(@Inject(USER_REPOSITORY) private readonly users: IUserRepository) {}

  async execute(query: GetCurrentUserQuery): Promise<CurrentUserView> {
    const user = await this.users.findById(UserId.fromString(query.userId));
    if (!user) {
      throw new NotFoundException(`User ${query.userId} not found`);
    }

    return {
      userId: user.id.value,
      email: user.email.value,
      displayName: user.displayName,
      role: user.role.value,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
