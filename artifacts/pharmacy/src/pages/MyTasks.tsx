import React from "react";
import { LineChart } from "lucide-react";
import PatientAccountLayout from "@/components/layout/PatientAccountLayout";

const DEMO_ROWS = [
  { week: "Week 1", dose: "2.5mg", weight: "92.4 kg", date: "12 Jan 2026" },
  { week: "Week 5", dose: "5mg", weight: "90.1 kg", date: "09 Feb 2026" },
  { week: "Week 9", dose: "7.5mg", weight: "88.6 kg", date: "09 Mar 2026" },
  { week: "Week 13", dose: "10mg", weight: "86.9 kg", date: "06 Apr 2026" },
  { week: "Week 17", dose: "12.5mg", weight: "85.2 kg", date: "04 May 2026" },
];

export default function MyTasks() {
  return (
    <PatientAccountLayout
      title="Progress Reviews"
      subtitle="Track your progress reviews and dosing history."
      icon={<LineChart className="h-5 w-5" />}
    >
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#314a40] text-white text-left">
                <th className="px-5 py-3 font-semibold">Review period</th>
                <th className="px-5 py-3 font-semibold">Dose</th>
                <th className="px-5 py-3 font-semibold">Recorded weight</th>
                <th className="px-5 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_ROWS.map((row, i) => (
                <tr key={row.week} className={i % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"}>
                  <td className="px-5 py-4 font-medium text-gray-900">{row.week}</td>
                  <td className="px-5 py-4 text-gray-700">{row.dose}</td>
                  <td className="px-5 py-4 text-gray-700">{row.weight}</td>
                  <td className="px-5 py-4 text-gray-500">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-5 py-4 text-xs text-gray-500 border-t border-gray-100">
          Progress reviews are completed every 4 weeks. Your prescriber uses this chart alongside your consultation answers.
        </p>
      </div>
    </PatientAccountLayout>
  );
}
