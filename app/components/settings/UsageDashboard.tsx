import { Info, Download, Calendar } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Button } from '~/components/ui/Button';
import { getModel } from '~/lib/models.client';
import { getAllUsage, getDatabase, type SessionUsageWithTimestamp } from '~/lib/persistence/db';
import type { AIProvider } from '~/types/model';
import { classNames } from '~/utils/classNames';
import { formatNumber } from '~/utils/format';

type DateFilter = 'today' | '7days' | '30days' | 'all';

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
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const filterButtonClasses = (active: boolean) =>
    classNames(
      'rounded-[calc(var(--radius))] px-3 py-1.5 text-sm font-medium transition-theme',
      active
        ? 'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text'
        : 'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3 hover:border-bolt-elements-borderColorActive',
    );

  // Filter data based on selected date range
  const filteredData = useMemo(() => {
    if (dateFilter === 'all') {
      return usageData;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let cutoffDate: Date;

    switch (dateFilter) {
      case 'today': {
        cutoffDate = startOfToday;
        break;
      }
      case '7days': {
        cutoffDate = new Date(startOfToday);
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      }
      case '30days': {
        cutoffDate = new Date(startOfToday);
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        break;
      }
      default: {
        return usageData;
      }
    }

    return usageData.filter((usage) => new Date(usage.timestamp) >= cutoffDate);
  }, [usageData, dateFilter]);

  const exportToCSV = () => {
    if (filteredData.length === 0) {
      toast.error('No usage data to export');
      return;
    }

    // CSV headers
    const headers = ['Date', 'Provider', 'Model', 'Input Tokens', 'Output Tokens', 'Cost (USD)'];

    // CSV rows
    const rows = filteredData.map((usage) => {
      const modelInfo =
        usage.provider && usage.modelId ? getModel(usage.provider as AIProvider, usage.modelId) : undefined;

      const modelName = modelInfo?.name ?? usage.modelId;

      return [
        new Date(usage.timestamp).toLocaleString(),
        usage.provider || 'N/A',
        modelName || 'N/A',
        usage.tokens.input,
        usage.tokens.output,
        usage.cost.toFixed(4),
      ];
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `boltdiy-usage-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Usage data exported successfully');
  };

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

  const totals = filteredData.reduce(
    (acc, session) => {
      acc.inputTokens += session.tokens.input;
      acc.outputTokens += session.tokens.output;
      acc.cost += session.cost;

      return acc;
    },
    { inputTokens: 0, outputTokens: 0, cost: 0 },
  );

  // Calculate usage by provider
  const usageByProvider = useMemo(() => {
    const providerMap = new Map<string, { inputTokens: number; outputTokens: number; cost: number }>();

    filteredData.forEach((usage) => {
      const provider = usage.provider || 'Unknown';
      const existing = providerMap.get(provider) || { inputTokens: 0, outputTokens: 0, cost: 0 };

      providerMap.set(provider, {
        inputTokens: existing.inputTokens + usage.tokens.input,
        outputTokens: existing.outputTokens + usage.tokens.output,
        cost: existing.cost + usage.cost,
      });
    });

    return Array.from(providerMap.entries())
      .map(([provider, data]) => ({ provider, ...data }))
      .sort((a, b) => b.cost - a.cost);
  }, [filteredData]);

  // Calculate cost by day
  const costByDay = useMemo(() => {
    const dayMap = new Map<string, number>();

    filteredData.forEach((usage) => {
      const date = new Date(usage.timestamp);
      const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const existing = dayMap.get(dayKey) || 0;
      dayMap.set(dayKey, existing + usage.cost);
    });

    return Array.from(dayMap.entries())
      .map(([day, cost]) => ({ day, cost }))
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-14); // Last 14 days max
  }, [filteredData]);

  if (loading) {
    return <p>Loading usage data...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Usage History</h2>
        <Button onClick={exportToCSV} size="sm" variant="secondary" disabled={loading || filteredData.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-[calc(var(--radius))] border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-4 transition-theme animate-scaleIn hover:border-bolt-elements-borderColorActive">
        <div className="flex gap-3">
          <Info className="h-4 w-4 flex-shrink-0 text-bolt-elements-textSecondary" />
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-bolt-elements-textPrimary">Note</h4>
            <p className="text-sm text-bolt-elements-textSecondary">
              Usage data is stored locally in your browser{' '}
              {usageData.length > 0 && `(${usageData.length} total records)`} and may not be perfectly accurate. This is
              for estimation purposes only.
            </p>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-3">
        <Calendar className="h-5 w-5 text-bolt-elements-textSecondary" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-bolt-elements-textSecondary">Filter:</span>
          <div className="flex gap-1">
            {[
              { value: 'today' as DateFilter, label: 'Today' },
              { value: '7days' as DateFilter, label: 'Last 7 Days' },
              { value: '30days' as DateFilter, label: 'Last 30 Days' },
              { value: 'all' as DateFilter, label: 'All Time' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setDateFilter(filter.value)}
                className={filterButtonClasses(dateFilter === filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          {dateFilter !== 'all' && (
            <span className="text-sm text-bolt-elements-textTertiary">({filteredData.length} records)</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-bolt-elements-background-depth-2 rounded-[calc(var(--radius))] border border-bolt-elements-borderColor transition-theme hover:border-bolt-elements-borderColorActive animate-scaleIn">
          <h3 className="text-sm font-medium text-bolt-elements-textSecondary">Total Input Tokens</h3>
          <p className="text-2xl font-bold text-bolt-elements-textPrimary">{formatNumber(totals.inputTokens)}</p>
        </div>
        <div className="p-4 bg-bolt-elements-background-depth-2 rounded-[calc(var(--radius))] border border-bolt-elements-borderColor transition-theme hover:border-bolt-elements-borderColorActive animate-scaleIn">
          <h3 className="text-sm font-medium text-bolt-elements-textSecondary">Total Output Tokens</h3>
          <p className="text-2xl font-bold text-bolt-elements-textPrimary">{formatNumber(totals.outputTokens)}</p>
        </div>
        <div className="p-4 bg-bolt-elements-background-depth-2 rounded-[calc(var(--radius))] border border-bolt-elements-borderColor transition-theme hover:border-bolt-elements-borderColorActive animate-scaleIn">
          <h3 className="text-sm font-medium text-bolt-elements-textSecondary">Total Estimated Cost</h3>
          <p className="text-2xl font-bold text-bolt-elements-textPrimary">${totals.cost.toFixed(4)}</p>
        </div>
      </div>

      {/* Charts */}
      {filteredData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Usage by Provider */}
          <div className="rounded-[calc(var(--radius))] border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-6 transition-theme hover:border-bolt-elements-borderColorActive animate-scaleIn">
            <h3 className="mb-4 text-base font-semibold text-bolt-elements-textPrimary">Usage by Provider</h3>
            <div className="space-y-3">
              {usageByProvider.map((item) => {
                const maxCost = Math.max(...usageByProvider.map((p) => p.cost));
                const percentage = maxCost > 0 ? (item.cost / maxCost) * 100 : 0;

                return (
                  <div key={item.provider} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-bolt-elements-textPrimary">{item.provider}</span>
                      <span className="text-bolt-elements-textSecondary">${item.cost.toFixed(4)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-bolt-elements-background-depth-3">
                      <div
                        className="h-full rounded-full bg-bolt-elements-button-primary-background transition-theme"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-bolt-elements-textTertiary">
                      <span>{formatNumber(item.inputTokens + item.outputTokens)} tokens</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cost Over Time */}
          <div className="rounded-[calc(var(--radius))] border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-6 transition-theme hover:border-bolt-elements-borderColorActive animate-scaleIn">
            <h3 className="mb-4 text-base font-semibold text-bolt-elements-textPrimary">Cost Over Time</h3>
            {costByDay.length > 0 ? (
              <div className="space-y-2">
                {costByDay.map((item) => {
                  const maxCost = Math.max(...costByDay.map((d) => d.cost));
                  const percentage = maxCost > 0 ? (item.cost / maxCost) * 100 : 0;
                  const date = new Date(item.day);
                  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                  return (
                    <div key={item.day} className="flex items-center gap-3">
                      <span className="w-16 text-xs text-bolt-elements-textSecondary">{formattedDate}</span>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-6 overflow-hidden rounded bg-bolt-elements-background-depth-3">
                          <div
                            className="h-full rounded bg-bolt-elements-button-primary-background transition-theme"
                            style={{ width: `${Math.max(percentage, 2)}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-xs font-medium text-bolt-elements-textPrimary">
                          ${item.cost.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-bolt-elements-textSecondary">
                No cost data available for the selected period.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-[calc(var(--radius))] border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 transition-theme hover:border-bolt-elements-borderColorActive">
        <table className="min-w-full divide-y divide-bolt-elements-borderColor">
          <thead className="bg-bolt-elements-background-depth-3">
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
            {filteredData.length > 0 ? (
              filteredData.map((usage, index) => <UsageRow key={index} usage={usage} />)
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-bolt-elements-textSecondary">
                  {dateFilter === 'all' ? 'No usage data recorded yet.' : 'No usage data for the selected time period.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
