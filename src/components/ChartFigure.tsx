import type { ReactNode } from 'react';

export interface ChartTable {
  caption: string;
  columns: string[];
  /** First cell of each row is the row header; the rest are numeric values. */
  rows: (string | number)[][];
}

interface Props {
  /** Plain-language summary of what the chart shows, read by assistive tech and shown as the caption. */
  summary: string;
  table: ChartTable;
  children: ReactNode;
}

/**
 * Wraps a visual chart for assistive tech: the SVG is hidden, and the same information
 * is available as a text summary (figcaption) and a data table behind a disclosure.
 */
export function ChartFigure({ summary, table, children }: Props) {
  return (
    <figure className="chart-figure">
      <div className="chart" aria-hidden="true">
        {children}
      </div>
      <figcaption className="chart-summary">{summary}</figcaption>
      <details className="chart-data">
        <summary>Show data table</summary>
        <div className="chart-data__scroll" tabIndex={0} role="region" aria-label={table.caption}>
          <table className="table table--compact">
            <caption className="sr-only">{table.caption}</caption>
            <thead>
              <tr>
                {table.columns.map((col, i) => (
                  <th key={col} scope="col" className={i > 0 ? 'num' : undefined}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={String(row[0])}>
                  {row.map((cell, i) =>
                    i === 0 ? (
                      <th key={i} scope="row">
                        {cell}
                      </th>
                    ) : (
                      <td key={i} className="num">
                        {cell}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
