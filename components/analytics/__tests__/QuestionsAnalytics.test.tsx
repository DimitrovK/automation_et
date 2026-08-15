import type { QuestionRow, QuestionsAnalyticsResponse } from '@/types/reports';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QuestionBank } from '@/components/analytics/panels/QuestionBank';
import { QuestionQuality } from '@/components/analytics/panels/QuestionQuality';

function options(counts: [number, number, number, number], correct: number) {
  const answered = counts.reduce((sum, n) => sum + n, 0);
  return counts.map((count, index) => ({
    option: index + 1,
    count,
    pct: answered ? Math.round((count * 1000) / answered) / 10 : null,
    is_correct: index + 1 === correct,
  }));
}

function question(over: Partial<QuestionRow> & Pick<QuestionRow, 'question_id' | 'text'>): QuestionRow {
  return {
    difficulty: 'NORMAL',
    correct_answer: 1,
    asked: 24,
    answered: 24,
    timeouts: 0,
    timeout_pct: 0,
    options: options([6, 18, 0, 0], 1),
    correct_pct: 25,
    top_wrong_option: 2,
    top_wrong_pct: 75,
    beaten_by_a_wrong_answer: true,
    ...over,
  };
}

function response(rows: QuestionRow[], over: Partial<QuestionsAnalyticsResponse['shape']> = {}): QuestionsAnalyticsResponse {
  return {
    quality: {
      rows,
      min_answers: 30,
      questions_measured: 2487,
      beaten_by_a_wrong_answer: rows.filter(r => r.beaten_by_a_wrong_answer).length,
    },
    shape: {
      difficulty: [
        { difficulty: 'EXTREME', answered: 12362, correct_pct: 50.3, timeouts: 2 },
        { difficulty: 'EASY', answered: 67679, correct_pct: 90.6, timeouts: 22 },
        { difficulty: 'NORMAL', answered: 64822, correct_pct: 70.7, timeouts: 17 },
      ],
      questions_served: 7120,
      questions_in_bank: 7219,
      bank_used_pct: 98.6,
      ...over,
    },
  } as unknown as QuestionsAnalyticsResponse;
}

describe('questionQuality', () => {
  it('marks a question a wrong option won', () => {
    // The finding. Without it the row is just a low correct rate, which a hard
    // question produces too.
    render(<QuestionQuality data={response([question({ question_id: 1, text: 'How many goals?' })])} />);

    expect(screen.getByText('A wrong option won')).toBeInTheDocument();
    expect(screen.getByText('How many goals?')).toBeInTheDocument();
  });

  it('shows every option, not only the winner', () => {
    // The split IS the evidence: 75/25 across two options is a different
    // question from 25/25/25/25, and both have the same correct rate.
    render(<QuestionQuality data={response([question({ question_id: 1, text: 'Q' })])} />);

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('does not flag a merely hard question', () => {
    render(
      <QuestionQuality
        data={response([question({
          question_id: 2,
          text: 'Hard one',
          options: options([2, 3, 3, 3], 1),
          correct_pct: 18.2,
          top_wrong_pct: 27.3,
          beaten_by_a_wrong_answer: false,
        })])}
      />,
    );

    expect(screen.queryByText('A wrong option won')).not.toBeInTheDocument();
  });

  it('reports timeouts beside the row rather than inside the bars', () => {
    // A timed-out answer carries whatever was highlighted when the clock ran
    // out. Counting it as a choice attributes an accident to the player.
    render(
      <QuestionQuality
        data={response([question({ question_id: 3, text: 'Long one', timeouts: 12, timeout_pct: 33.3 })])}
      />,
    );

    expect(screen.getByText('33.3% ran out of time')).toBeInTheDocument();
  });

  it('shows a count rather than "null%" when every answer timed out', () => {
    // No deliberate answers means no share to state, and `null%` is worse than
    // the raw number (Copilot on #128).
    render(
      <QuestionQuality
        data={response([question({
          question_id: 4,
          text: 'All timed out',
          answered: 0,
          timeouts: 31,
          timeout_pct: null,
          options: options([0, 0, 0, 0], 1),
          correct_pct: null,
          top_wrong_pct: null,
          beaten_by_a_wrong_answer: false,
        })])}
      />,
    );

    expect(screen.getByText('31 ran out of time')).toBeInTheDocument();
    expect(screen.queryByText(/null%/)).not.toBeInTheDocument();
  });

  it('leads with how many need a look', () => {
    render(<QuestionQuality data={response([question({ question_id: 1, text: 'Q' })])} />);

    expect(screen.getByText('Need a look')).toBeInTheDocument();
  });

  it('says nothing was rated rather than showing an empty list', () => {
    render(<QuestionQuality data={response([])} />);

    expect(screen.getByText('No question was answered enough times to rate.')).toBeInTheDocument();
  });
});

describe('questionBank', () => {
  it('answers whether more questions are needed', () => {
    // "We need more questions" is either true or it is not, and nothing said
    // which before.
    render(<QuestionBank data={response([])} />);

    expect(screen.getByText(/7,120 of 7,219 questions were served/)).toBeInTheDocument();
    expect(screen.getByText(/98.6% of the bank/)).toBeInTheDocument();
  });

  it('orders the tiers by the scale, not the alphabet', () => {
    render(<QuestionBank data={response([])} />);
    const rows = screen.getAllByRole('row').slice(1, 4);

    expect(rows.map(row => within(row).getAllByRole('cell')[0].textContent?.trim()))
      .toEqual(['EASY', 'NORMAL', 'EXTREME']);
  });
});
