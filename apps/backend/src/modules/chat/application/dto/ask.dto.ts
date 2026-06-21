import { QueryType } from '../../domain/query-type';
import { AnswerFormat, StructuredData } from '../handlers/answer-format';
import { Citation } from '../citations/citation-extractor';

/** Response envelope for POST /api/v1/ask (Task 12.5). */
export interface AskResponseDto {
  threadId: string;
  messageId: string;
  queryType: QueryType;
  format: AnswerFormat;
  prose: string;
  structuredData: StructuredData;
  citations: Citation[];
}
