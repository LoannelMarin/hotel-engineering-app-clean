import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function ActivityChart({ data }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-[#1d1f24] w-full">
      <h3 className="font-semibold mb-3 text-[#0B5150] text-base sm:text-lg">
        Actividad semanal
      </h3>

      <div className="w-full h-[200px] sm:h-[240px] md:h-[280px] lg:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 15, bottom: 0, left: -5 }}
          >
            <XAxis
              dataKey="day"
              stroke="#aaa"
              fontSize={12}
              tickMargin={6}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#aaa"
              fontSize={12}
              width={30}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255,255,255,0.95)",
                borderRadius: "10px",
                border: "1px solid #ddd",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0B5150"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
