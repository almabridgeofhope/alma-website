import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

const AgeDistributionChart = () => {
  const { t } = useLanguage();

  const data = [
    {
      name: t("news.article4.charts.age.children"),
      value: 40,
      ageRange: t("news.article4.charts.age.children.range"),
    },
    {
      name: t("news.article4.charts.age.youth"),
      value: 25,
      ageRange: t("news.article4.charts.age.youth.range"),
    },
    {
      name: t("news.article4.charts.age.adults"),
      value: 25,
      ageRange: t("news.article4.charts.age.adults.range"),
    },
    {
      name: t("news.article4.charts.age.elderly"),
      value: 10,
      ageRange: t("news.article4.charts.age.elderly.range"),
    },
  ];

  return (
    <div className="w-full">
      <h4 className="text-lg font-semibold mb-4 text-foreground">
        {t("news.article4.charts.age.title")}
      </h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 30,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: 'hsl(var(--primary))', fontSize: 12 }}
            angle={-15}
            textAnchor="end"
            height={50}
            interval={0}
          />
          <YAxis 
            label={{ 
              value: t("news.article4.charts.age.yAxisLabel"), 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: 'hsl(var(--primary))' }
            }}
            domain={[0, 45]}
            tick={{ fill: 'hsl(var(--primary))' }}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-medium text-foreground">
                      {data.name} ({data.ageRange})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {data.value}%
                    </p>
                  </div>
                );
              }
              return null;
            }}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
            }}
          />
          <Bar 
            dataKey="value" 
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AgeDistributionChart;

