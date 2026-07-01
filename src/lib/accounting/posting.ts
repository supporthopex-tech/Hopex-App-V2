export type JournalLineInput = {
  accountId: string;
  description?: string;
  debit?: number;
  credit?: number;
};

export function totalsForLines(lines: JournalLineInput[]) {
  return lines.reduce(
    (totals, line) => ({
      debit: totals.debit + Number(line.debit ?? 0),
      credit: totals.credit + Number(line.credit ?? 0),
    }),
    { debit: 0, credit: 0 },
  );
}

export function validateBalancedJournal(lines: JournalLineInput[]) {
  const totals = totalsForLines(lines);
  if (lines.length < 2) return { ok: false, message: "Journal entry must have at least two lines.", totals };
  if (totals.debit <= 0 || totals.credit <= 0) return { ok: false, message: "Journal entry must include debit and credit amounts.", totals };
  if (Math.round(totals.debit * 100) !== Math.round(totals.credit * 100)) {
    return { ok: false, message: `Debits (${totals.debit.toFixed(2)}) must equal credits (${totals.credit.toFixed(2)}).`, totals };
  }
  return { ok: true, message: "", totals };
}
