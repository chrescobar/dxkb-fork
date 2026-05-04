import DBStatisticsShell from "@/components/statistics/db-statistics-shell";
import {
  dbStatisticsDefinitions,
  fetchDbStatistics,
  type StatisticDefinition,
} from "@/lib/services/statistics";

const numberFormatter = new Intl.NumberFormat("en-US");

interface StatisticCardProps {
  definition: StatisticDefinition;
  count: number | null;
}

const StatisticCard = ({ definition, count }: StatisticCardProps) => {
  const displayValue = count === null ? "—" : numberFormatter.format(count);
  return (
    <div>
      <div className="text-4xl font-bold mb-2">{displayValue}</div>
      <div>{definition.label}</div>
    </div>
  );
};

const DBStatistics = async () => {
  const counts = await fetchDbStatistics();

  return (
    <DBStatisticsShell>
      {dbStatisticsDefinitions.map((definition) => (
        <StatisticCard
          key={definition.key}
          definition={definition}
          count={counts[definition.key]}
        />
      ))}
    </DBStatisticsShell>
  );
};

export default DBStatistics;
