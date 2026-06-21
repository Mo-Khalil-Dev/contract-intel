import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  RequestUser,
} from '../../auth/infrastructure/decorators/current-user.decorator';
import { AskRequestDto } from './dtos/ask-request.dto';
import { AskPortfolioCommand } from '../application/commands/ask-portfolio.command';
import { AskResponseDto } from '../application/dto/ask.dto';

/**
 * HTTP boundary for "Ask Your Portfolio" (Phase 12, Requirement 15).
 *
 * Auth and the response-envelope interceptor are global (see main.ts).
 * The request is auth-scoped via `@CurrentUser`; v1 treats `orgId` as
 * `userId`. Errors thrown by the handler (empty question, thread not
 * found, LLM failure) are mapped by the shared exception filter.
 */
@ApiTags('Chat')
@Controller('ask')
export class ChatController {
  constructor(private readonly commandBus: CommandBus) {}

  /** POST /api/v1/ask — classify, ground, answer, persist. */
  @Post()
  @ApiOkResponse({
    description:
      'A grounded answer with query type, format, structured data, and validated citations.',
  })
  async ask(
    @CurrentUser() user: RequestUser,
    @Body() body: AskRequestDto,
  ): Promise<AskResponseDto> {
    return this.commandBus.execute<AskPortfolioCommand, AskResponseDto>(
      new AskPortfolioCommand(
        user.userId,
        user.userId, // v1: orgId == userId
        body.question,
        body.threadId,
      ),
    );
  }
}
