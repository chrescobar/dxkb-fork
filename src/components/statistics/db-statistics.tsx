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
    <section className="py-12 bg-primary text-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 text-center">Database Statistics</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {dbStatisticsDefinitions.map((definition) => (
            <StatisticCard
              key={definition.key}
              definition={definition}
              count={counts[definition.key]}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DBStatistics;
