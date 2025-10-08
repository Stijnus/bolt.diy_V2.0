import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { getModel } from '~/lib/models.client';
import { getAllUsage, getDatabase, type SessionUsageWithTimestamp } from '~/lib/persistence/db';
import type { AIProvider } from '~/types/model';
import { formatNumber } from '~/utils/format';

function UsageRow({ usage }: { usage: SessionUsageWithTimestamp }) {
  const { timestamp, tokens, cost, provider, modelId } = usage;
  const modelInfo = provider && modelId ? getModel(provider as AIProvider, modelId) : undefined;
  const modelName = modelInfo?.name ?? modelId;

  return (
    <tr className="border-b border-bolt-elements-borderColor/50 hover:bg-bolt-elements-background-depth-1">
      <td className="p-3 text-sm text-bolt-elements-textSecondary">{new Date(timestamp).toLocaleString()}</td>
      <td className="p-3 text-sm">{provider}</td>
      <td className="p-3 text-sm">{modelName}</td>
      <td className="p-3 text-sm text-right">{formatNumber(tokens.input)}</td>
      <td className="p-3 text-sm text-right">{formatNumber(tokens.output)}</td>
      <td className="p-3 text-sm text-right">${cost.toFixed(4)}</td>
    </tr>
  );
}

export function UsageDashboard() {
  const [usageData, setUsageData] = useState<SessionUsageWithTimestamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const db = await getDatabase();

        if (!db) {
          throw new Error('Database not available.');
        }

        const data = await getAllUsage(db);

        setUsageData(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } catch (err) {
        setError('Failed to load usage data from the database.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void loadUsage();
  }, []);

  const totals = usageData.reduce(
    (acc, session) => {
      acc.inputTokens += session.tokens.input;
      acc.outputTokens += session.tokens.output;
      acc.cost += session.cost;

      return acc;
    },
    { inputTokens: 0, outputTokens: 0, cost: 0 },
  );

  if (loading) {
    return <p>Loading usage data...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Usage History</h2>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Note</AlertTitle>
        <AlertDescription>
          Usage data is stored locally in your browser and may not be perfectly accurate. This is for estimation
          purposes only.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-bolt-elements-background-depth-1 rounded-lg border border-bolt-elements-borderColor/50">
          <h3 className="text-sm font-medium text-bolt-elements-textSecondary">Total Input Tokens</h3>
          <p className="text-2xl font-bold">{formatNumber(totals.inputTokens)}</p>
        </div>
        <div className="p-4 bg-bolt-elements-background-depth-1 rounded-lg border border-bolt-elements-borderColor/50">
          <h3 className="text-sm font-medium text-bolt-elements-textSecondary">Total Output Tokens</h3>
          <p className="text-2xl font-bold">{formatNumber(totals.outputTokens)}</p>
        </div>
        <div className="p-4 bg-bolt-elements-background-depth-1 rounded-lg border border-bolt-elements-borderColor/50">
          <h3 className="text-sm font-medium text-bolt-elements-textSecondary">Total Estimated Cost</h3>
          <p className="text-2xl font-bold">${totals.cost.toFixed(4)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-bolt-elements-borderColor/50">
        <table className="min-w-full divide-y divide-bolt-elements-borderColor/50">
          <thead className="bg-bolt-elements-background-depth-1">
            <tr>
              <th className="p-3 text-left text-xs font-medium text-bolt-elements-textSecondary uppercase tracking-wider">
                Date
              </th>
              <th className="p-3 text-left text-xs font-medium text-bolt-elements-textSecondary uppercase tracking-wider">
                Provider
              </th>
              <th className="p-3 text-left text-xs font-medium text-bolt-elements-textSecondary uppercase tracking-wider">
                Model
              </th>
              <th className="p-3 text-right text-xs font-medium text-bolt-elements-textSecondary uppercase tracking-wider">
                Input Tokens
              </th>
              <th className="p-3 text-right text-xs font-medium text-bolt-elements-textSecondary uppercase tracking-wider">
                Output Tokens
              </th>
              <th className="p-3 text-right text-xs font-medium text-bolt-elements-textSecondary uppercase tracking-wider">
                Cost
              </th>
            </tr>
          </thead>
          <tbody className="bg-bolt-elements-background divide-y divide-bolt-elements-borderColor/50">
            {usageData.length > 0 ? (
              usageData.map((usage, index) => <UsageRow key={index} usage={usage} />)
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-bolt-elements-textSecondary">
                  No usage data recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
