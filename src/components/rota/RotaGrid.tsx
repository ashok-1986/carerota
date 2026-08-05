"use client";

import { useState } from "react";

interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  roleId: string;
  roleName: string;
  startTime: string;
  endTime: string;
  homeId: string;
  homeFloorId?: string;
}

interface RotaGridProps {
  shifts: Shift[];
  date: Date;
}

export default function RotaGrid({ shifts }: RotaGridProps) {
  const [currentShifts] = useState<Shift[]>(shifts);

  // Generate time slots (7am to 11pm)
  const timeSlots = Array.from({ length: 17 }, (_, i) => i + 7);

  // Generate days of the week
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
            {daysOfWeek.map((day) => (
              <th
                key={day}
                className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {timeSlots.map((hour) => (
            <tr key={hour}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {hour}:00
              </td>
              {daysOfWeek.map((day, index) => (
                <td
                  key={`${day}-${hour}`}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200 min-h-[60px]"
                >
                  {/* Render shifts for this time slot and day */}
                  {currentShifts
                    .filter(
                      (shift) =>
                        new Date(shift.startTime).getHours() === hour &&
                        new Date(shift.startTime).getDay() === index + 1
                    )
                    .map((shift) => (
                      <div
                        key={shift.id}
                        className="bg-blue-100 rounded p-2 mb-1 text-xs"
                      >
                        <div className="font-medium">{shift.staffName}</div>
                        <div>{shift.roleName}</div>
                        <div>
                          {new Date(shift.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {new Date(shift.endTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}