import { Injectable } from '@nestjs/common';
import {
  ExtractInput,
  ExtractedClause,
  IClauseExtractor,
} from '../../application/ports/clause-extractor.port';

/**
 * Deterministic mock used in local dev and tests. Scans the input text
 * for a handful of well-known phrase fragments — if a fragment is present
 * the matching clause is emitted with verbatim text (so the handler's
 * indexOf offset-resolution finds it). One clause carries a nested child
 * to exercise parent-FK resolution end-to-end.
 *
 * Same input → same output. No network, no $.
 */
@Injectable()
export class MockClauseExtractor implements IClauseExtractor {
  static readonly MODEL_VERSION = 'mock/mock-clause-extractor@v1';

  // Each rule yields exactly one clause if its `match` substring appears
  // in the input text. The handler resolves offsets via indexOf, so the
  // emitted `text` field must be a verbatim slice of `input.text`.
  private static readonly RULES: Array<{
    match: string;
    clientRef: string;
    parentClientRef: string | null;
    type: string;
    confidence: number;
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskFlags: string[];
    riskExplanation: string;
  }> = [
    {
      match: 'Indemnification',
      clientRef: 'c1',
      parentClientRef: null,
      type: 'indemnification',
      confidence: 0.92,
      riskScore: 65,
      riskLevel: 'high',
      riskFlags: ['broad_scope'],
      riskExplanation: 'Mock: broad indemnification scope.',
    },
    {
      match: 'Limitation of Liability',
      clientRef: 'c2',
      parentClientRef: null,
      type: 'limitation_of_liability',
      confidence: 0.95,
      riskScore: 20,
      riskLevel: 'low',
      riskFlags: [],
      riskExplanation: 'Mock: standard cap.',
    },
    {
      match: 'Termination',
      clientRef: 'c3',
      parentClientRef: null,
      type: 'termination',
      confidence: 0.9,
      riskScore: 30,
      riskLevel: 'medium',
      riskFlags: [],
      riskExplanation: 'Mock: termination terms.',
    },
    {
      match: 'material breach',
      clientRef: 'c3.1',
      parentClientRef: 'c3',
      type: 'termination',
      confidence: 0.85,
      riskScore: 35,
      riskLevel: 'medium',
      riskFlags: [],
      riskExplanation: 'Mock: nested sub-clause under Termination.',
    },
    {
      match: 'Payment',
      clientRef: 'c4',
      parentClientRef: null,
      type: 'payment_terms',
      confidence: 0.88,
      riskScore: 25,
      riskLevel: 'low',
      riskFlags: [],
      riskExplanation: 'Mock: net-30 payment.',
    },
  ];

  // Phrase fragments → verbatim sentence ranges. Walks the rule's match
  // to the next sentence-ending punctuation (. ! ?), giving the handler a
  // realistic clause-sized slice to resolve.
  extract(input: ExtractInput): Promise<ExtractedClause[]> {
    const text = input.text;
    const out: ExtractedClause[] = [];
    for (const rule of MockClauseExtractor.RULES) {
      const idx = text.indexOf(rule.match);
      if (idx === -1) continue;
      const end = this.findSentenceEnd(text, idx);
      const slice = text.slice(idx, end).trim();
      if (!slice) continue;
      out.push({
        clientRef: rule.clientRef,
        parentClientRef: rule.parentClientRef,
        type: rule.type,
        confidence: rule.confidence,
        text: slice,
        riskScore: rule.riskScore,
        riskLevel: rule.riskLevel,
        riskFlags: rule.riskFlags,
        riskExplanation: rule.riskExplanation,
      });
    }
    return Promise.resolve(out);
  }

  getModelVersion(): string {
    return MockClauseExtractor.MODEL_VERSION;
  }

  private findSentenceEnd(text: string, from: number): number {
    for (let i = from; i < text.length; i++) {
      const ch = text[i];
      if (ch === '.' || ch === '!' || ch === '?') return i + 1;
    }
    return text.length;
  }
}
