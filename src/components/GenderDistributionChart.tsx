import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

const GenderDistributionChart = () => {
  const { t } = useLanguage();

  const data = [
    { name: t("news.article4.charts.gender.female"), value: 65 },
    { name: t("news.article4.charts.gender.male"), value: 35 },
  ];

  // Using orange and Alma primary blue
  const COLORS = ['#f97316', 'hsl(217 64% 34%)']; // Orange and Alma primary blue

  return (
    <div className="w-full">
      <h4 className="text-lg font-semibold mb-4 text-foreground">
        {t("news.article4.charts.gender.title")}
      </h4>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}, ${value}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`${value}%`, t("news.article4.charts.gender.tooltipLabel")]}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GenderDistributionChart;

