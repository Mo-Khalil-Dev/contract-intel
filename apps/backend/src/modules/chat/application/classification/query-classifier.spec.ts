import { classifyQuery } from './query-classifier';

describe('classifyQuery', () => {
  const cases: Array<[string, ReturnType<typeof classifyQuery>]> = [
    ['Which contracts have unlimited liability?', 'risk-analysis'],
    ['What are my riskiest contracts?', 'risk-analysis'],
    ['Show me everything flagged critical', 'risk-analysis'],
    ['Compare the Acme MSA versus the Globex MSA', 'comparison'],
    ['What is the difference between these two agreements?', 'comparison'],
    ['When do my contracts expire?', 'timeline'],
    ['Which renewals are coming up next quarter?', 'timeline'],
    ['Find all indemnification clauses', 'clause-type-search'],
    ['Which contracts have an arbitration clause?', 'clause-type-search'],
    ['How much are we paying across all vendors?', 'financial'],
    ['What is the total contract value?', 'financial'],
    ['Summarize the "SaaS Vendor" contract', 'document-specific'],
    ['Tell me about the Globex agreement', 'document-specific'],
    ['Hello there', 'general'],
    ['What can you do?', 'general'],
  ];

  it.each(cases)('classifies %j as %s', (question, expected) => {
    expect(classifyQuery(question)).toBe(expected);
  });

  it('is case-insensitive', () => {
    expect(classifyQuery('WHICH CONTRACTS HAVE UNLIMITED LIABILITY?')).toBe(
      'risk-analysis',
    );
  });

  it('never throws and always returns a type for empty input', () => {
    expect(classifyQuery('')).toBe('general');
  });
});
