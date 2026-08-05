"use client";

import { useState } from "react";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  employmentType: string;
  contractedHours: number | null;
  payRateHourly: number | null;
  authUserId: string | null;
  isActive: boolean;
  homeFloorId: string | null;
  floorName: string | null;
  floorCode: string | null;
}

interface StaffDirectoryProps {
  staff: StaffMember[];
}

export default function StaffDirectory({ staff }: StaffDirectoryProps) {
  const [staffList] = useState<StaffMember[]>(staff);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStaff = staffList.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search staff..."
          className="w-full px-4 py-2 border rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {filteredStaff.map((member) => (
            <li key={member.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-indigo-600 truncate">
                    {member.name}
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      member.isActive 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <div className="mr-6 flex items-center text-sm text-gray-500">
                      {member.role}
                    </div>
                    <div className="mr-6 flex items-center text-sm text-gray-500">
                      {member.employmentType}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <span>{member.contractedHours ?? 0} hrs/week</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}